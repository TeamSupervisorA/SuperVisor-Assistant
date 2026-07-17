const Task = require('../models/Task');
const Project = require('../models/Project');

// Check the user can access the task's project
const canAccessProject = (project, user) => {
  if (user.role === 'admin') return true;
  if (project.supervisor && project.supervisor.toString() === user.id) return true;
  return project.students.some(s => s.toString() === user.id);
};

// @desc    Get tasks (optionally filtered by project)
// @route   GET /api/tasks?project=<projectId>
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    // Implement Delay Detection: Update overdue tasks to 'delayed'
    await Task.updateMany(
      { status: { $ne: 'completed' }, dueDate: { $lt: new Date() } },
      { $set: { status: 'delayed' } }
    );

    let query = {};

    if (req.query.project) {
      query.project = req.query.project;
    }

    if (req.user.role === 'student') {
      query.assignedTo = req.user.id;
    } else if (req.user.role === 'supervisor') {
      const projects = await Project.find({ supervisor: req.user.id }).select('_id');
      query.project = query.project || { $in: projects.map(p => p._id) };
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

    const task = await Task.create(req.body);

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

    task = await Task.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: task });
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
