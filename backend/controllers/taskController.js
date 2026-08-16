const Task = require('../models/Task');
const { Project, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');
const User = require('../models/User');

const completedStatuses = new Set(['done', 'completed']);
const lifecycleStatuses = new Set(['todo', 'in_progress', 'blocked', 'review', 'done', 'cancelled']);
const transitions = {
  todo: new Set(['in_progress', 'blocked', 'cancelled']),
  in_progress: new Set(['todo', 'blocked', 'review', 'done', 'cancelled']),
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

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to add tasks to this project' });
    }

    // Tasks created by students default to being assigned to themselves,
    // otherwise the student list view (filtered by assignedTo) would never show them
    if (req.user.role === 'student') {
      req.body.assignedTo = req.user.id;
    }

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
    if (req.user.role === 'student') return res.status(403).json({ success: false, error: 'Students can update work status through the task transition controls' });

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
