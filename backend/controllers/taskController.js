const Task = require('../models/Task');
const { Project, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');

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

    if (req.user.role === 'student') {
      query.assignedTo = req.user.id;
    } else if (req.user.role === 'supervisor') {
      query.project = query.project || { $in: await projectIdsForUser(req.user) };
    }

    const tasks = await Task.find(query)
      .populate('project', 'title')
      .populate('assignedTo', 'name email');

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
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
    if (req.user.role === 'student' && !req.body.assignedTo) {
      req.body.assignedTo = req.user.id;
    }

    if (req.body.dependencies?.length) {
      const dependencyCount = await Task.countDocuments({ _id: { $in: req.body.dependencies }, project: project._id });
      if (dependencyCount !== req.body.dependencies.length) return res.status(422).json({ success: false, error: 'Dependencies must be tasks in the same project' });
    }
    if (await hasDependencyCycle(null, req.body.dependencies)) {
      return res.status(422).json({ success: false, error: 'Task dependencies cannot contain a cycle' });
    }
    const task = await Task.create({ ...req.body, history: [{ actor: req.user.id, action: 'created', toStatus: req.body.status || 'todo' }] });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
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

    let updates = req.body;
    if (req.user.role === 'student') {
      // Students can only move their own tasks between statuses
      if (!task.assignedTo || task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to update this task' });
      }
      updates = { status: req.body.status };
    }

    if (updates.status === 'blocked' && !updates.blockedReason && !task.blockedReason) {
      return res.status(422).json({ success: false, error: 'Blocked tasks require a blockedReason' });
    }
    if (updates.dependencies) {
      const dependencyCount = await Task.countDocuments({ _id: { $in: updates.dependencies }, project: task.project._id });
      if (dependencyCount !== updates.dependencies.length) return res.status(422).json({ success: false, error: 'Dependencies must be tasks in the same project' });
      if (await hasDependencyCycle(task._id, updates.dependencies)) return res.status(422).json({ success: false, error: 'Task dependencies cannot contain a cycle' });
    }
    if (['done', 'completed'].includes(updates.status) && !task.completedAt) updates.completedAt = new Date();
    updates.history = [...task.history, {
      actor: req.user.id,
      action: 'updated',
      fromStatus: task.status,
      toStatus: updates.status || task.status
    }];

    task = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc Transition a task through the academic task lifecycle
exports.transitionTask = async (req, res) => {
  try {
    const { status, note = '', blockedReason = '', evidence = [] } = req.body;
    if (!['todo', 'in_progress', 'blocked', 'done', 'cancelled'].includes(status)) {
      return res.status(422).json({ success: false, error: 'Invalid task status transition' });
    }
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    if (!canAccessProject(task.project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to transition this task' });
    if (req.user.role === 'student' && task.assignedTo?.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Only the assignee may transition this task' });
    if (status === 'blocked' && !blockedReason) return res.status(422).json({ success: false, error: 'Blocked tasks require a blockedReason' });

    const fromStatus = task.status;
    task.status = status;
    task.blockedReason = status === 'blocked' ? blockedReason : '';
    if (status === 'done') task.completedAt = new Date();
    if (evidence.length) task.evidence = evidence;
    task.history.push({ actor: req.user.id, action: 'transitioned', fromStatus, toStatus: status, note });
    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
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
