const Project = require('../models/Project');

// @desc    Get projects (students/supervisors see their own, admins see all)
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query = { students: req.user.id };
    } else if (req.user.role === 'supervisor') {
      query = { supervisor: req.user.id };
    }

    const projects = await Project.find(query)
      .populate('supervisor', 'name email')
      .populate('students', 'name email');

    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('supervisor', 'name email')
      .populate('students', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Create project
// @route   POST /api/projects
// @access  Private (supervisor/admin)
exports.createProject = async (req, res) => {
  try {
    const { title, description, students, status } = req.body;

    const project = await Project.create({
      title,
      description,
      students,
      status,
      supervisor: req.user.role === 'admin' && req.body.supervisor ? req.body.supervisor : req.user.id
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (owning supervisor or admin)
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && project.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this project' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (owning supervisor or admin)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && project.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this project' });
    }

    await project.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
