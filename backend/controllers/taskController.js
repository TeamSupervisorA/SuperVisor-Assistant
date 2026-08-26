const Task = require('../models/Task');
const { Project, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const { recordAudit } = require('../services/auditService');
const { projectCapabilities } = require('../utils/projectWorkflow');

const completedStatuses = new Set(['done', 'completed']);
const notify = async (fields) => {
  try { await Notification.create(fields); } catch { /* review records remain authoritative if notification storage is unavailable */ }
};
const userId = (value) => String(value?._id || value || '');
const safeEvidenceUrl = (value) => {
  const url = String(value || '').trim();
  if (!url || url.startsWith('/api/upload/file/')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return parsed.toString();
  } catch { /* handled below */ }
  const error = new Error('Evidence links must use HTTPS or an uploaded project file');
  error.statusCode = 422;
  throw error;
};
const notifyTaskPeople = async (task, actorId, fields) => {
  const recipients = new Set();
  if (task.assignedTo) recipients.add(userId(task.assignedTo));
  if (task.project?.supervisor) recipients.add(userId(task.project.supervisor));
  recipients.delete(userId(actorId));
  await Promise.all([...recipients].filter(Boolean).map((recipient) => notify({ user: recipient, ...fields })));
};
const lifecycleStatuses = new Set(['todo', 'in_progress', 'blocked', 'review', 'revision', 'done', 'cancelled']);
const transitions = {
  todo: new Set(['in_progress', 'blocked', 'cancelled']),
  in_progress: new Set(['todo', 'blocked', 'review', 'cancelled']),
  blocked: new Set(['todo', 'in_progress', 'cancelled']),
  review: new Set(['in_progress', 'blocked', 'done']),
  revision: new Set(['in_progress', 'blocked', 'cancelled']),
  done: new Set(['in_progress']),
  cancelled: new Set(['todo'])
};

const normalizedStatus = (status) => status === 'completed' ? 'done' : status === 'delayed' ? 'todo' : status;

const validateAssignee = async (project, assignee) => {
  if (assignee === undefined || assignee === null || assignee === '') return null;
  if (!project.students.some((student) => student.toString() === String(assignee))) {
    const error = new Error('Task assignee must be a student assigned to this project');
    error.statusCode = 422;
    throw error;
  }
  const student = await User.findOne({ _id: assignee, role: 'student', status: 'active' }).select('_id');
  if (!student) {
    const error = new Error('Task assignee must be an active student account');
    error.statusCode = 422;
    throw error;
  }
  return student._id;
};

const hasOpenDependencies = async (dependencies = []) => {
  if (!dependencies.length) return false;
  const incomplete = await Task.countDocuments({ _id: { $in: dependencies }, status: { $nin: [...completedStatuses] } });
  return incomplete > 0;
};

const hasDependencyCycle = async (taskId, dependencies) => {
  const visited = new Set();
  const walk = async (id) => {
    const key = id.toString();
    if (key === taskId?.toString()) return true;
    if (visited.has(key)) return false;
    visited.add(key);
    const task = await Task.findById(id).select('dependencies');
    if (!task) return false;
    for (const dependency of task.dependencies) if (await walk(dependency)) return true;
    return false;
  };
  for (const dependency of dependencies || []) if (await walk(dependency)) return true;
  return false;
};

const validateMilestone = (project, milestone) => {
  if (!milestone) return null;
  const item = project.milestones?.id(milestone);
  if (!item || item.status === 'cancelled') {
    const error = new Error('Choose an active milestone from this project');
    error.statusCode = 422;
    throw error;
  }
  return item._id;
};

const validateDependencyDates = async ({ projectId, dependencies = [], dueDate, taskId = null }) => {
  if (dueDate && dependencies.length) {
    const invalid = await Task.findOne({ _id: { $in: dependencies }, project: projectId, dueDate: { $gt: new Date(dueDate) } }).select('title');
    if (invalid) {
      const error = new Error(`The deadline cannot precede prerequisite “${invalid.title}”`);
      error.statusCode = 422;
      throw error;
    }
  }
  if (taskId && dueDate) {
    const invalidDependent = await Task.findOne({ project: projectId, dependencies: taskId, dueDate: { $lt: new Date(dueDate) } }).select('title');
    if (invalidDependent) {
      const error = new Error(`This deadline would fall after dependent task “${invalidDependent.title}”`);
      error.statusCode = 422;
      throw error;
    }
  }
};

const assertRevision = (task, requested) => {
  if (requested === undefined) return;
  if (Number(requested) !== task.revisionNumber) {
    const error = new Error('This task changed since you opened it. Refresh and try again.');
    error.statusCode = 409;
    error.code = 'STALE_TASK_VERSION';
    throw error;
  }
};

// @desc    Get tasks (optionally filtered by project)
// @route   GET /api/tasks?project=<projectId>
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    let query = {};

    if (req.query.project) {
      const project = await Project.findById(req.query.project);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!canAccessProject(project, req.user)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this project\'s tasks' });
      }
      query.project = req.query.project;
    }

    if (req.query.scope === 'assigned') query.assignedTo = req.user.id;
    if (req.query.scope === 'created') query.createdBy = req.user.id;

    // A project workspace is shared: members need to see each other's tasks
    // and prerequisite work in order to understand the timeline. The update
    // and transition endpoints still restrict a student to their own task.
    if (req.user.role === 'student' && !req.query.project) {
      query.assignedTo = req.user.id;
    } else if (['supervisor', 'admin'].includes(req.user.role)) {
      query.project = query.project || { $in: await projectIdsForUser(req.user) };
    }

    const tasks = await Task.find(query)
      .populate('project', 'title')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name role')
      .populate('comments.author', 'name role')
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (supervisor/admin)
exports.createTask = async (req, res) => {
  try {
    const project = await Project.findById(req.body.project);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!canAccessProject(project, req.user) || project.status === 'archived') return res.status(403).json({ success: false, error: 'Cannot add tasks to an archived project' });
    const canCreateOfficial = projectCapabilities(project, req.user).canAssignTasks;

    // Tasks created by students default to being assigned to themselves,
    // otherwise the student list view (filtered by assignedTo) would never show them
    if (req.body.dependencies?.length) {
      const dependencyCount = await Task.countDocuments({ _id: { $in: req.body.dependencies }, project: project._id });
      if (dependencyCount !== req.body.dependencies.length) return res.status(422).json({ success: false, error: 'Dependencies must be tasks in the same project' });
    }
    if (await hasDependencyCycle(null, req.body.dependencies)) {
      return res.status(422).json({ success: false, error: 'Task dependencies cannot contain a cycle' });
    }
    await validateDependencyDates({ projectId: project._id, dependencies: req.body.dependencies || [], dueDate: req.body.dueDate });
    // New tasks always begin as planned. Lifecycle state, blockers, and
    // completion evidence are server-owned and move through /transition so a
    // client cannot create a pre-completed task and inflate project progress.
    const allowed = ['title', 'description', 'project', 'assignedTo', 'priority', 'dueDate', 'dependencies', 'acceptanceCriteria', 'milestone', 'phase', 'requiredDeliverable'];
    const input = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    input.milestone = validateMilestone(project, input.milestone);
    if (!canCreateOfficial) input.assignedTo = null;
    else if (req.user.role === 'student' && input.assignedTo === undefined) input.assignedTo = req.user.id;
    if (input.assignedTo !== undefined) input.assignedTo = await validateAssignee(project, input.assignedTo);
    const kind = canCreateOfficial ? 'official' : 'suggestion';
    const task = await Task.create({ ...input, createdBy: req.user.id, kind, suggestionState: canCreateOfficial ? 'accepted' : 'pending', status: 'todo', history: [{ actor: req.user.id, action: kind === 'official' ? 'created' : 'suggested', toStatus: 'todo' }] });
    await notifyTaskPeople({ ...task.toObject(), project }, req.user.id, {
      title: kind === 'official' ? 'New task assigned' : 'New task suggestion',
      message: kind === 'official' ? `You were assigned “${task.title}”.` : `“${task.title}” was proposed for the project.`,
      type: 'info',
      link: '/tasks-milestones'
    });
    await recordAudit({ actor: req.user.id, action: kind === 'official' ? 'task.created' : 'task.suggested', entityType: 'task', entityId: task._id, metadata: { project: project._id, milestone: task.milestone } });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

// @desc    Update task (students may only update status of their own tasks)
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (!canAccessProject(task.project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this task' });
    }

    if (req.body.status !== undefined || req.body.blockedReason !== undefined) {
      return res.status(422).json({ success: false, error: 'Use the task transition endpoint to change task status or blockers' });
    }
    assertRevision(task, req.body?.revisionNumber);
    if (req.user.role === 'student' && !projectCapabilities(task.project, req.user).canAssignTasks && !(task.kind === 'suggestion' && task.suggestionState === 'pending' && task.createdBy?.toString() === req.user.id)) {
      return res.status(403).json({ success: false, error: 'Only the project leader can edit and allocate official tasks; students may edit their own pending suggestions' });
    }

    const editableFields = ['title', 'description', 'priority', 'dueDate', 'dependencies', 'acceptanceCriteria', 'assignedTo', 'milestone', 'phase', 'requiredDeliverable'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => editableFields.includes(key)));
    if (!Object.keys(updates).length) return res.status(422).json({ success: false, error: 'No editable task fields were provided' });
    const previousAssignee = userId(task.assignedTo);
    if (Object.hasOwn(updates, 'assignedTo')) updates.assignedTo = await validateAssignee(task.project, updates.assignedTo);
    if (Object.hasOwn(updates, 'milestone')) updates.milestone = validateMilestone(task.project, updates.milestone);
    if (updates.dependencies) {
      const dependencyCount = await Task.countDocuments({ _id: { $in: updates.dependencies }, project: task.project._id });
      if (dependencyCount !== updates.dependencies.length) return res.status(422).json({ success: false, error: 'Dependencies must be tasks in the same project' });
      if (await hasDependencyCycle(task._id, updates.dependencies)) return res.status(422).json({ success: false, error: 'Task dependencies cannot contain a cycle' });
    }
    await validateDependencyDates({ projectId: task.project._id, dependencies: updates.dependencies || task.dependencies, dueDate: updates.dueDate || task.dueDate, taskId: task._id });
    updates.history = [...task.history, {
      actor: req.user.id,
      action: 'updated',
      fromStatus: task.status,
      toStatus: task.status
    }];
    updates.revisionNumber = task.revisionNumber + 1;

    task = await Task.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true
    });

    if (updates.assignedTo && userId(updates.assignedTo) !== previousAssignee && userId(updates.assignedTo) !== req.user.id) {
      await notify({ user: updates.assignedTo, title: 'Task assigned to you', message: `You are now responsible for “${task.title}”.`, type: 'info', link: '/tasks-milestones' });
    }

    await recordAudit({ actor: req.user.id, action: 'task.updated', entityType: 'task', entityId: task._id, metadata: { fields: Object.keys(updates).filter((field) => !['history', 'revisionNumber'].includes(field)) } });
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message, ...(error.code ? { code: error.code } : {}) });
  }
};

// @desc Transition a task through the academic task lifecycle
exports.transitionTask = async (req, res) => {
  try {
    const { status, note = '', blockedReason = '', evidence = [] } = req.body;
    const targetStatus = normalizedStatus(status);
    if (!lifecycleStatuses.has(targetStatus)) {
      return res.status(422).json({ success: false, error: 'Invalid task status transition' });
    }
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (!canAccessProject(task.project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to transition this task' });
    assertRevision(task, req.body?.revisionNumber);
    if (task.kind === 'suggestion' && task.suggestionState !== 'accepted') return res.status(409).json({ success: false, error: 'A suggested task must be accepted before work can start' });
    if (req.user.role === 'student' && task.assignedTo?.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Only the assignee may transition this task' });
    if (targetStatus === 'cancelled' && req.user.role === 'student') {
      const capabilities = projectCapabilities(task.project, req.user);
      const leaderCanCancel = capabilities.isLeader && ['todo', 'blocked'].includes(normalizedStatus(task.status)) && (!task.createdBy || task.createdBy.toString() === req.user.id);
      if (!leaderCanCancel) return res.status(403).json({ success: false, error: 'Only the assigned supervisor or administrator can cancel this task' });
    }
    const fromStatus = normalizedStatus(task.status);
    if (fromStatus !== targetStatus && !transitions[fromStatus]?.has(targetStatus)) return res.status(422).json({ success: false, error: `A ${fromStatus.replace('_', ' ')} task cannot move directly to ${targetStatus.replace('_', ' ')}` });
    if (targetStatus === 'blocked' && !blockedReason) return res.status(422).json({ success: false, error: 'Blocked tasks require a blockedReason' });
    if (['in_progress', 'review', 'done'].includes(targetStatus) && await hasOpenDependencies(task.dependencies)) return res.status(422).json({ success: false, error: 'Complete all prerequisite tasks before continuing this task' });
    if (fromStatus === 'review' && targetStatus === 'done' && req.user.role === 'student') return res.status(403).json({ success: false, error: 'A supervisor must approve a task submitted for review' });
    if (targetStatus === 'review') return res.status(422).json({ success: false, error: 'Use Request review and attach a deliverable before sending this task to a supervisor' });
    if (fromStatus === 'review') return res.status(422).json({ success: false, error: 'Use the review decision endpoint to approve the work or request a revision' });

    task.status = targetStatus;
    task.blockedReason = targetStatus === 'blocked' ? blockedReason.trim() : '';
    if (targetStatus === 'done') task.completedAt = new Date();
    if (!completedStatuses.has(targetStatus)) task.completedAt = undefined;
    if (evidence.length) task.evidence = evidence;
    task.history.push({ actor: req.user.id, action: 'transitioned', fromStatus, toStatus: targetStatus, note: note.trim() });
    task.revisionNumber += 1;
    await task.save();
    if (targetStatus === 'blocked') {
      await notifyTaskPeople(task, req.user.id, { title: 'Task blocked', message: `“${task.title}” is blocked: ${task.blockedReason}`, type: 'warning', link: '/tasks-milestones' });
    }
    await recordAudit({ actor: req.user.id, action: 'task.status_changed', entityType: 'task', entityId: task._id, metadata: { fromStatus, toStatus: targetStatus, note: note.trim() } });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

// A task review is always backed by a real submission and an active supervisor.
exports.requestTaskReview = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (!canAccessProject(task.project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to request review for this task' });
    if (req.user.role !== 'student' || task.assignedTo?.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Only the assigned student can submit completed work for review' });
    if (!task.project.supervisor) return res.status(409).json({ success: false, error: 'Assign an active supervisor before requesting task review' });
    if (normalizedStatus(task.status) !== 'in_progress') return res.status(422).json({ success: false, error: 'Only work in progress can be submitted for review' });
    if (await hasOpenDependencies(task.dependencies)) return res.status(422).json({ success: false, error: 'Complete all prerequisite tasks before requesting review' });
    const submissionQuery = { _id: req.body?.submissionId, task: task._id, project: task.project._id, student: req.user.id };
    const submission = await Submission.findOne(submissionQuery);
    if (!submission) return res.status(422).json({ success: false, error: 'Choose a submission linked to this task' });
    if (!['Draft', 'Submitted'].includes(submission.status)) return res.status(409).json({ success: false, error: 'Choose a saved draft that is not already under review or decided' });

    const previousStatus = normalizedStatus(task.status);
    task.status = 'review';
    task.reviewSubmission = submission._id;
    task.reviewRequestedAt = new Date();
    task.reviewedAt = undefined;
    task.reviewedBy = undefined;
    task.evidence = [{
      name: String(submission.title || 'Task evidence').slice(0, 240),
      fileUrl: safeEvidenceUrl(submission.fileUrl),
      note: String(submission.content || '').slice(0, 3000),
      submission: submission._id,
      addedBy: req.user.id,
      addedAt: new Date()
    }];
    task.history.push({ actor: req.user.id, action: 'review_requested', fromStatus: previousStatus, toStatus: 'review', submission: submission._id, note: String(req.body?.note || '').trim() });
    task.revisionNumber += 1;
    submission.status = 'Under Review';
    await submission.save();
    try {
      await task.save();
    } catch (error) {
      submission.status = 'Draft';
      await submission.save().catch(() => {});
      throw error;
    }
    await recordAudit({ actor: req.user.id, action: 'task.review_requested', entityType: 'task', entityId: task._id, metadata: { submissionId: submission._id } });
    await notify({ user: task.project.supervisor, title: 'Task ready for review', message: `${req.user.name} submitted “${task.title}” with supporting evidence.`, type: 'info', link: '/tasks-milestones' });
    res.json({ success: true, data: task, submission });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

// The assigned student may withdraw an undecided review without deleting the
// linked deliverable. This keeps Review from becoming a dead-end when the
// wrong version was attached or more work is needed before a decision.
exports.withdrawTaskReview = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (!canAccessProject(task.project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to withdraw this review' });
    if (req.user.role !== 'student' || task.assignedTo?.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Only the assigned student can withdraw this review' });
    if (normalizedStatus(task.status) !== 'review' || !task.reviewSubmission) return res.status(409).json({ success: false, error: 'This task does not have a pending review to withdraw' });
    if (task.reviewedAt || task.reviewedBy) return res.status(409).json({ success: false, error: 'A decided review cannot be withdrawn' });

    const submission = await Submission.findOne({ _id: task.reviewSubmission, task: task._id, project: task.project._id, student: req.user.id });
    if (!submission || submission.status !== 'Under Review') return res.status(409).json({ success: false, error: 'The linked deliverable is no longer awaiting review' });
    const note = String(req.body?.note || 'Review withdrawn by the assigned student.').trim().slice(0, 1000);
    const submissionId = submission._id;

    task.status = 'in_progress';
    task.reviewSubmission = null;
    task.reviewRequestedAt = undefined;
    task.history.push({ actor: req.user.id, action: 'review_withdrawn', fromStatus: 'review', toStatus: 'in_progress', submission: submissionId, note });
    task.revisionNumber += 1;
    submission.status = 'Draft';
    await submission.save();
    try {
      await task.save();
    } catch (error) {
      submission.status = 'Under Review';
      await submission.save().catch(() => {});
      throw error;
    }
    await recordAudit({ actor: req.user.id, action: 'task.review_withdrawn', entityType: 'task', entityId: task._id, metadata: { submissionId, note } });
    await notify({ user: task.project.supervisor, title: 'Task review withdrawn', message: `${req.user.name} withdrew “${task.title}” to update the evidence.`, type: 'info', link: '/tasks-milestones' });
    res.json({ success: true, data: task, submission });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

// Supervisor/admin decision updates the task and its linked submission as one workflow.
exports.decideTaskReview = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (req.user.role !== 'admin' && task.project.supervisor?.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Only the assigned supervisor can decide this review' });
    if (normalizedStatus(task.status) !== 'review' || !task.reviewSubmission) return res.status(409).json({ success: false, error: 'This task does not have an active submission-backed review' });
    const decision = req.body?.decision;
    if (!['approve', 'revision'].includes(decision)) return res.status(422).json({ success: false, error: 'Decision must be approve or revision' });
    const submission = await Submission.findOne({ _id: task.reviewSubmission, task: task._id, project: task.project._id });
    if (!submission) return res.status(409).json({ success: false, error: 'The linked submission no longer exists' });
    const previousTaskStatus = task.status;
    const previousSubmissionStatus = submission.status;
    const feedback = String(req.body?.feedback || '').trim();
    if (decision === 'revision' && !feedback) return res.status(422).json({ success: false, error: 'Revision requests require actionable feedback' });

    task.status = decision === 'approve' ? 'done' : 'revision';
    task.completedAt = decision === 'approve' ? new Date() : undefined;
    task.reviewedAt = new Date();
    task.reviewedBy = req.user.id;
    task.history.push({ actor: req.user.id, action: decision === 'approve' ? 'review_approved' : 'revision_requested', fromStatus: 'review', toStatus: task.status, submission: submission._id, note: feedback });
    task.revisionNumber += 1;
    submission.status = decision === 'approve' ? 'Graded' : 'Needs Revision';
    submission.feedback = feedback;
    if (req.body?.grade !== undefined && decision === 'approve') submission.grade = String(req.body.grade);
    await submission.save();
    try {
      await task.save();
    } catch (error) {
      submission.status = previousSubmissionStatus;
      await submission.save().catch(() => {});
      task.status = previousTaskStatus;
      throw error;
    }
    await notify({
      user: submission.student,
      title: decision === 'approve' ? 'Feedback received' : 'Revision requested',
      message: decision === 'approve'
        ? `Your deliverable for "${task.title}" was accepted.${feedback ? ` Feedback: ${feedback}` : ''}`
        : `Your deliverable for "${task.title}" needs revision. ${feedback}`,
      type: decision === 'approve' ? 'success' : 'warning',
      link: '/student-submissions'
    });
    await recordAudit({ actor: req.user.id, action: `task.review_${decision}`, entityType: 'task', entityId: task._id, metadata: { submissionId: submission._id, feedback } });
    res.json({ success: true, data: task, submission });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.decideTaskSuggestion = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    const capabilities = projectCapabilities(task.project, req.user);
    if (!(capabilities.isAdmin || capabilities.isSupervisor || capabilities.isLeader)) return res.status(403).json({ success: false, error: 'Only the project leader, assigned supervisor, or administrator can decide task suggestions' });
    if (task.kind !== 'suggestion' || task.suggestionState !== 'pending') return res.status(409).json({ success: false, error: 'This task suggestion has already been decided' });
    const decision = req.body?.decision;
    if (!['accept', 'reject'].includes(decision)) return res.status(422).json({ success: false, error: 'Decision must be accept or reject' });
    if (decision === 'accept') {
      task.kind = 'official';
      task.suggestionState = 'accepted';
      task.assignedTo = await validateAssignee(task.project, req.body?.assignedTo || task.createdBy);
    } else {
      task.suggestionState = 'rejected';
      task.status = 'cancelled';
    }
    task.history.push({ actor: req.user.id, action: `suggestion_${decision}ed`, fromStatus: 'todo', toStatus: task.status, note: String(req.body?.note || '').trim() });
    task.revisionNumber += 1;
    await task.save();
    if (task.createdBy && userId(task.createdBy) !== req.user.id) {
      await notify({ user: task.createdBy, title: decision === 'accept' ? 'Task suggestion accepted' : 'Task suggestion declined', message: `Your suggestion “${task.title}” was ${decision === 'accept' ? 'accepted and assigned' : 'declined'}.`, type: decision === 'accept' ? 'success' : 'info', link: '/tasks-milestones' });
    }
    await recordAudit({ actor: req.user.id, action: `task.suggestion_${decision}ed`, entityType: 'task', entityId: task._id, metadata: { assignedTo: task.assignedTo || null } });
    res.json({ success: true, data: task });
  } catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
};

exports.addTaskComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (!canAccessProject(task.project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to comment on this task' });
    const body = String(req.body?.body || '').trim();
    if (!body) return res.status(422).json({ success: false, error: 'Comment text is required' });
    const requestedKind = req.body?.kind === 'supervisor_instruction' ? 'supervisor_instruction' : 'comment';
    if (requestedKind === 'supervisor_instruction' && req.user.role !== 'admin' && task.project.supervisor?.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Only the assigned supervisor can add supervisor instructions' });
    task.comments.push({ author: req.user.id, body, kind: requestedKind });
    task.revisionNumber += 1;
    await task.save();
    await notifyTaskPeople(task, req.user.id, {
      title: requestedKind === 'supervisor_instruction' ? 'New supervisor instruction' : 'New task comment',
      message: `${req.user.name} added ${requestedKind === 'supervisor_instruction' ? 'an instruction' : 'a comment'} on “${task.title}”.`,
      type: requestedKind === 'supervisor_instruction' ? 'warning' : 'info',
      link: '/tasks-milestones'
    });
    await recordAudit({ actor: req.user.id, action: requestedKind === 'supervisor_instruction' ? 'task.instruction_added' : 'task.comment_added', entityType: 'task', entityId: task._id });
    await task.populate('comments.author', 'name role');
    res.status(201).json({ success: true, data: task });
  } catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
};

// Evidence may be prepared without changing task status. The assigned student
// still has to submit the final deliverable for supervisor review.
exports.addTaskEvidence = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (!canAccessProject(task.project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to add evidence to this task' });
    const assignedStudent = req.user.role === 'student' && userId(task.assignedTo) === req.user.id;
    if (!assignedStudent) return res.status(403).json({ success: false, error: 'Only the assigned student can add completion evidence' });
    if (!['in_progress', 'revision'].includes(normalizedStatus(task.status))) return res.status(409).json({ success: false, error: 'Start the task before adding completion evidence' });
    const fileUrl = safeEvidenceUrl(req.body?.fileUrl);
    const note = String(req.body?.note || '').trim();
    const name = String(req.body?.name || '').trim();
    if (!fileUrl && !note) return res.status(422).json({ success: false, error: 'Add an HTTPS link, uploaded file, or evidence note' });
    task.evidence.push({ name: name || 'Task evidence', fileUrl, note, addedBy: req.user.id });
    task.history.push({ actor: req.user.id, action: 'evidence_added', fromStatus: task.status, toStatus: task.status, note: name || 'Task evidence added' });
    task.revisionNumber += 1;
    await task.save();
    await recordAudit({ actor: req.user.id, action: 'task.evidence_added', entityType: 'task', entityId: task._id, metadata: { hasFile: Boolean(fileUrl) } });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (supervisor/admin)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    if (!canAccessProject(task.project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this task' });
    }
    const capabilities = projectCapabilities(task.project, req.user);
    const leaderCanDelete = capabilities.isLeader && normalizedStatus(task.status) === 'todo' && (!task.createdBy || task.createdBy.toString() === req.user.id);
    if (!(capabilities.isAdmin || capabilities.isSupervisor || leaderCanDelete)) return res.status(403).json({ success: false, error: 'Only a supervisor, administrator, or the leader who created an untouched planned task can delete it' });

    const [submissionCount, dependentCount] = await Promise.all([
      Submission.countDocuments({ task: task._id }),
      Task.countDocuments({ dependencies: task._id })
    ]);
    if (submissionCount || dependentCount || task.history.length > 1) return res.status(409).json({ success: false, error: 'This task has project history and cannot be deleted. Cancel it to preserve the audit trail.' });
    await task.deleteOne();
    await recordAudit({ actor: req.user.id, action: 'task.deleted', entityType: 'task', entityId: task._id, metadata: { project: task.project._id } });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
