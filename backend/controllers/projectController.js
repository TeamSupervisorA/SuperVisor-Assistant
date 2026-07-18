const Project = require('../models/Project');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Works for both populated docs and raw ObjectIds
const idOf = (ref) => (ref && ref._id ? ref._id : ref)?.toString();

// A user may view/report on a project if they are admin, its supervisor, or one of its students
const isProjectMember = (project, user) => {
  if (user.role === 'admin') return true;
  if (idOf(project.supervisor) === user.id) return true;
  return project.students.some(s => idOf(s) === user.id);
};

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
// @access  Private (project members, supervisor, admin)
exports.getProjectReport = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('students', 'name email')
      .populate('supervisor', 'name email');

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!isProjectMember(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this project report' });
    }

    // Refresh delay detection so the report reflects reality
    await Task.updateMany(
      { project: req.params.id, status: { $ne: 'completed' }, dueDate: { $lt: new Date() } },
      { $set: { status: 'delayed' } }
    );

    const [tasks, submissions, meetings] = await Promise.all([
      Task.find({ project: req.params.id }).populate('assignedTo', 'name').sort({ dueDate: 1 }),
      Submission.find({ project: req.params.id }).populate('student', 'name').sort({ submittedAt: -1 }),
      Meeting.find({ project: req.params.id }).sort({ date: -1 })
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => ['todo', 'in_progress', 'review'].includes(t.status)).length;
    const delayedTasks = tasks.filter(t => t.status === 'delayed').length;

    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const gradedCount = submissions.filter(s => s.status === 'Graded').length;
    const health = delayedTasks > 0
      ? (delayedTasks >= Math.max(1, Math.ceil(totalTasks * 0.3)) ? 'At Risk' : 'Needs Attention')
      : 'On Track';

    const summary = totalTasks === 0
      ? `"${project.title}" has no tasks defined yet. Break the project into tasks and milestones to start tracking progress.`
      : `"${project.title}" is ${progressPercentage}% complete: ${completedTasks} of ${totalTasks} tasks are done, ` +
        `${pendingTasks} in progress or pending, and ${delayedTasks} delayed. ` +
        `${submissions.length} deliverable${submissions.length === 1 ? '' : 's'} submitted (${gradedCount} graded). ` +
        `Overall status: ${health}.`;

    const report = {
      projectTitle: project.title,
      description: project.description,
      status: project.status,
      health,
      summary,
      generatedAt: new Date(),
      teamMembers: project.students,
      supervisor: project.supervisor,
      progressPercentage,
      taskSummary: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        delayed: delayedTasks,
      },
      tasks: tasks.map(t => ({
        title: t.title,
        status: t.status,
        assignedTo: t.assignedTo?.name || 'Unassigned',
        dueDate: t.dueDate
      })),
      submissions: submissions.map(s => ({
        title: s.title,
        student: s.student?.name,
        status: s.status,
        grade: s.grade,
        date: s.submittedAt
      })),
      meetingsHeld: meetings.filter(m => m.status === 'Completed').length,
      meetingsUpcoming: meetings.filter(m => m.status === 'Upcoming').length,
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

// @desc    Add a team member to a project by email
// @route   POST /api/projects/:id/members
// @access  Private (project members, supervisor, admin)
exports.addProjectMember = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Please provide the email of the student to add' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!isProjectMember(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this team' });
    }

    const newMember = await User.findOne({ email: email.toLowerCase().trim() });
    if (!newMember) {
      return res.status(404).json({ success: false, error: 'No user found with that email' });
    }
    if (newMember.role !== 'student') {
      return res.status(400).json({ success: false, error: 'Only students can be added as team members' });
    }
    if (project.students.some(s => idOf(s) === newMember.id)) {
      return res.status(400).json({ success: false, error: 'This student is already on the team' });
    }

    project.students.push(newMember._id);
    await project.save();

    // Best-effort notification — team change should not fail if this does
    try {
      await Notification.create({
        user: newMember._id,
        title: 'Added to a project team',
        message: `${req.user.name} added you to the project "${project.title}".`,
        type: 'success',
        link: '/team-management'
      });
    } catch (e) { /* non-fatal */ }

    const populated = await Project.findById(project._id)
      .populate('supervisor', 'name email')
      .populate('students', 'name email');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Remove a team member from a project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private (supervisor/admin, or a student removing themselves)
exports.removeProjectMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const isSelf = req.params.userId === req.user.id;
    const isSupervisor = idOf(project.supervisor) === req.user.id;
    if (req.user.role !== 'admin' && !isSupervisor && !isSelf) {
      return res.status(403).json({ success: false, error: 'Not authorized to remove this member' });
    }

    if (!project.students.some(s => idOf(s) === req.params.userId)) {
      return res.status(404).json({ success: false, error: 'That user is not on this team' });
    }

    project.students = project.students.filter(s => idOf(s) !== req.params.userId);
    await project.save();

    const populated = await Project.findById(project._id)
      .populate('supervisor', 'name email')
      .populate('students', 'name email');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
