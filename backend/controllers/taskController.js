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
const lifecycleStatuses = new Set(['todo', 'in_progress', 'blocked', 'review', 'done', 'cancelled']);
const transitions = {
  todo: new Set(['in_progress', 'blocked', 'cancelled']),
  in_progress: new Set(['todo', 'blocked', 'review', 'cancelled']),
  blocked: new Set(['todo', 'in_progress', 'cancelled']),
  review: new Set(['in_progress', 'blocked', 'done']),
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

    // A project workspace is shared: members need to see each other's tasks
    // and prerequisite work in order to understand the timeline. The update
    // and transition endpoints still restrict a student to their own task.
    if (req.user.role === 'student' && !req.query.project) {
      query.assignedTo = req.user.id;
    } else if (req.user.role === 'supervisor') {
      query.project = query.project || { $in: await projectIdsForUser(req.user) };
    }

    const tasks = await Task.find(query)
      .populate('project', 'title')
      .populate('assignedTo', 'name email');

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

    if (!projectCapabilities(project, req.user).canAssignTasks) {
      return res.status(403).json({ success: false, error: 'Only the project leader, assigned supervisor, or administrator can add tasks to an active project' });
    }

    // Tasks created by students default to being assigned to themselves,
    // otherwise the student list view (filtered by assignedTo) would never show them
    if (req.body.dependencies?.length) {
      const dependencyCount = await Task.countDocuments({ _id: { $in: req.body.dependencies }, project: project._id });
      if (dependencyCount !== req.body.dependencies.length) return res.status(422).json({ success: false, error: 'Dependencies must be tasks in the same project' });
    }
    if (await hasDependencyCycle(null, req.body.dependencies)) {
      return res.status(422).json({ success: false, error: 'Task dependencies cannot contain a cycle' });
    }
    // New tasks always begin as planned. Lifecycle state, blockers, and
    // completion evidence are server-owned and move through /transition so a
    // client cannot create a pre-completed task and inflate project progress.
    const allowed = ['title', 'description', 'project', 'assignedTo', 'priority', 'dueDate', 'dependencies', 'acceptanceCriteria'];
    const input = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (req.user.role === 'student' && input.assignedTo === undefined) input.assignedTo = req.user.id;
    if (input.assignedTo !== undefined) input.assignedTo = await validateAssignee(project, input.assignedTo);
    const task = await Task.create({ ...input, status: 'todo', history: [{ actor: req.user.id, action: 'created', toStatus: 'todo' }] });

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
    if (req.user.role === 'student' && !projectCapabilities(task.project, req.user).canAssignTasks) {
      return res.status(403).json({ success: false, error: 'Only the project leader can edit and allocate official tasks' });
    }

    const editableFields = ['title', 'description', 'priority', 'dueDate', 'dependencies', 'acceptanceCriteria', 'assignedTo', 'evidence'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => editableFields.includes(key)));
    if (!Object.keys(updates).length) return res.status(422).json({ success: false, error: 'No editable task fields were provided' });
    if (Object.hasOwn(updates, 'assignedTo')) updates.assignedTo = await validateAssignee(task.project, updates.assignedTo);
    if (updates.dependencies) {
      const dependencyCount = await Task.countDocuments({ _id: { $in: updates.dependencies }, project: task.project._id });
      if (dependencyCount !== updates.dependencies.length) return res.status(422).json({ success: false, error: 'Dependencies must be tasks in the same project' });
      if (await hasDependencyCycle(task._id, updates.dependencies)) return res.status(422).json({ success: false, error: 'Task dependencies cannot contain a cycle' });
    }
    updates.history = [...task.history, {
      actor: req.user.id,
      action: 'updated',
      fromStatus: task.status,
      toStatus: task.status
    }];

    task = await Task.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true
    });

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
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
    if (req.user.role === 'student' && task.assignedTo?.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Only the assignee may transition this task' });
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
    await task.save();
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
    if (req.user.role !== 'student' || task.assignedTo?.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Only the assigned student can request review' });
    if (!task.project.supervisor) return res.status(409).json({ success: false, error: 'Assign an active supervisor before requesting task review' });
    if (normalizedStatus(task.status) !== 'in_progress') return res.status(422).json({ success: false, error: 'Only work in progress can be submitted for review' });
    if (await hasOpenDependencies(task.dependencies)) return res.status(422).json({ success: false, error: 'Complete all prerequisite tasks before requesting review' });
    const submission = await Submission.findOne({ _id: req.body?.submissionId, task: task._id, project: task.project._id, student: req.user.id });
    if (!submission) return res.status(422).json({ success: false, error: 'Choose a submission linked to this task' });
    if (submission.status === 'Graded') return res.status(409).json({ success: false, error: 'This submission has already been graded' });

    const previousStatus = normalizedStatus(task.status);
    task.status = 'review';
    task.reviewSubmission = submission._id;
    task.reviewRequestedAt = new Date();
    task.reviewedAt = undefined;
    task.reviewedBy = undefined;
    task.history.push({ actor: req.user.id, action: 'review_requested', fromStatus: previousStatus, toStatus: 'review', submission: submission._id, note: String(req.body?.note || '').trim() });
    submission.status = 'Under Review';
    await submission.save();
    try {
      await task.save();
    } catch (error) {
      submission.status = 'Submitted';
      await submission.save().catch(() => {});
      throw error;
    }
    await recordAudit({ actor: req.user.id, action: 'task.review_requested', entityType: 'task', entityId: task._id, metadata: { submissionId: submission._id } });
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
    submission.status = 'Submitted';
    await submission.save();
    try {
      await task.save();
    } catch (error) {
      submission.status = 'Under Review';
      await submission.save().catch(() => {});
      throw error;
    }
    await recordAudit({ actor: req.user.id, action: 'task.review_withdrawn', entityType: 'task', entityId: task._id, metadata: { submissionId, note } });
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

    task.status = decision === 'approve' ? 'done' : 'in_progress';
    task.completedAt = decision === 'approve' ? new Date() : undefined;
    task.reviewedAt = new Date();
    task.reviewedBy = req.user.id;
    task.history.push({ actor: req.user.id, action: decision === 'approve' ? 'review_approved' : 'revision_requested', fromStatus: 'review', toStatus: task.status, submission: submission._id, note: feedback });
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

    await task.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
