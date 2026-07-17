const Project = require('../models/Project');
const Task = require('../models/Task');
const Submission = require('../models/Submission');

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

// @desc    Explore all projects (Global Search)
// @route   GET /api/projects/explore
// @access  Private
exports.exploreProjects = async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    
    if (search) {
      query = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const projects = await Project.find(query)
      .populate('supervisor', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 })
      .limit(50); // Limit results for performance

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
// @access  Private (student/supervisor/admin)
exports.createProject = async (req, res) => {
  try {
    const { title, description, students, status } = req.body;

    let projectData = {
      title,
      description,
      status: status || 'proposed'
    };

    if (req.user.role === 'student') {
      projectData.students = [req.user.id];
      projectData.supervisor = null; // To be assigned later
    } else {
      projectData.students = students || [];
      projectData.supervisor = req.user.role === 'admin' && req.body.supervisor ? req.body.supervisor : req.user.id;
    }

    const project = await Project.create(projectData);

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

    if (req.user.role !== 'admin' && project.supervisor?.toString() !== req.user.id) {
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

    if (req.user.role !== 'admin' && project.supervisor?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this project' });
    }

    await project.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Generate Project Report
// @route   GET /api/projects/:id/report
// @access  Private
exports.getProjectReport = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('students', 'name email')
      .populate('supervisor', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const tasks = await Task.find({ project: req.params.id });
    const submissions = await Submission.find({ project: req.params.id }).sort({ submittedAt: -1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => ['todo', 'in_progress', 'review'].includes(t.status)).length;
    const delayedTasks = tasks.filter(t => t.status === 'delayed').length;

    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const report = {
      projectTitle: project.title,
      description: project.description,
      status: project.status,
      teamMembers: project.students,
      supervisor: project.supervisor,
      progressPercentage,
      taskSummary: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        delayed: delayedTasks,
      },
      recentFeedback: submissions.map(sub => ({
        submissionTitle: sub.title,
        feedback: sub.feedback,
        grade: sub.grade,
        date: sub.submittedAt
      })).filter(sub => sub.feedback)
    };

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
