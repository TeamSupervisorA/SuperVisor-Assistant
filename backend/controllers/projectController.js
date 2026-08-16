const { Project, idOf, canAccessProject } = require('../utils/projectAccess');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Team = require('../models/Team');
const ProposalVersion = require('../models/ProposalVersion');
const Report = require('../models/Report');
const Review = require('../models/Review');
const ProgressLog = require('../models/ProgressLog');
const WorkspaceDocument = require('../models/WorkspaceDocument');
const Resource = require('../models/Resource');
const Message = require('../models/Message');
const Evaluation = require('../models/Evaluation');
const PlagiarismReport = require('../models/PlagiarismReport');
const { recordAudit } = require('../services/auditService');

const activeStudentIds = async (studentIds) => {
  if (!Array.isArray(studentIds)) {
    const error = new Error('students must be an array of student IDs');
    error.statusCode = 422;
    throw error;
  }
  const uniqueIds = [...new Set(studentIds.map((id) => String(id)))];
  if (!uniqueIds.length) return [];
  const students = await User.find({
    _id: { $in: uniqueIds },
    role: 'student',
    status: 'active'
  }).select('_id');
  if (students.length !== uniqueIds.length) {
    const error = new Error('Every project member must be an active student account');
    error.statusCode = 422;
    throw error;
  }
  return students.map((student) => student._id);
};

const populateProject = (id) => Project.findById(id)
  .populate('supervisor', 'name email')
  .populate('students', 'name email');

const notify = async (fields) => {
  try { await Notification.create(fields); } catch { /* notifications are non-critical */ }
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
    const filters = [];

    // Project discovery must not become a directory of every student's work.
    // Students see only projects they belong to. Supervisors see their own
    // projects plus unassigned proposals they can claim; administrators see all.
    if (req.user.role === 'student') {
      filters.push({ students: req.user.id });
    } else if (req.user.role === 'supervisor') {
      filters.push({
        $or: [
          { supervisor: req.user.id },
          { supervisor: null, status: { $in: ['proposed', 'active'] } }
        ]
      });
    }
    
    if (search && typeof search === 'string') {
      // Escape special characters to prevent regex injection
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filters.push({
        $or: [
          { title: { $regex: safeSearch, $options: 'i' } },
          { description: { $regex: safeSearch, $options: 'i' } }
        ]
      });
    }

    const query = filters.length === 0 ? {} : filters.length === 1 ? filters[0] : { $and: filters };

    const projects = await Project.find(query)
      // An explore card only needs collaboration names. Do not leak student
      // e-mail addresses to other project members or prospective supervisors.
      .populate('supervisor', 'name')
      .populate('students', 'name department')
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

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this project' });
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
    const { title, description, students } = req.body;

    let projectData = {
      title,
      description
    };

    if (req.user.role === 'student') {
      projectData.students = [req.user.id];
      projectData.supervisor = null; // To be assigned later
      // A student-created project enters the proposal workflow. A supervisor
      // or administrator controls any later lifecycle state change.
      projectData.status = 'proposed';
    } else {
      projectData.students = await activeStudentIds(students || []);
      // A supervisor-created project is immediately an active workspace. It
      // must not remain in the student-proposal state with no way for that
      // supervisor to approve it through the normal proposal workflow.
      projectData.status = 'active';

      if (req.user.role === 'supervisor') {
        projectData.supervisor = req.user.id;
      } else {
        // Administrators assign a real supervisor instead of becoming a
        // project supervisor themselves. This preserves the supervisor ↔
        // student ownership model and avoids orphaned admin-owned projects.
        if (!req.body.supervisor) {
          return res.status(422).json({ success: false, error: 'Choose an active supervisor when creating a project as an administrator' });
        }
        const supervisor = await User.findOne({ _id: req.body.supervisor, role: 'supervisor', status: 'active' }).select('_id');
        if (!supervisor) return res.status(422).json({ success: false, error: 'The assigned supervisor must be an active supervisor account' });
        projectData.supervisor = supervisor._id;
      }
    }

    const project = await Project.create(projectData);

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Claim an unassigned student proposal, or assign/reassign it as an admin
// @route   POST /api/projects/:id/claim
// @access  Private (supervisor/admin)
exports.claimProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    let supervisor;
    if (req.user.role === 'supervisor') {
      if (project.supervisor && idOf(project.supervisor) !== req.user.id) {
        return res.status(409).json({ success: false, error: 'This project is already assigned to another supervisor' });
      }
      supervisor = req.user;
    } else {
      const supervisorId = req.body?.supervisorId || req.body?.supervisor;
      if (!supervisorId) return res.status(422).json({ success: false, error: 'An administrator must provide supervisorId when assigning a project' });
      supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor', status: 'active' });
      if (!supervisor) return res.status(422).json({ success: false, error: 'The assigned supervisor must be an active supervisor account' });
    }

    const previousSupervisor = project.supervisor ? idOf(project.supervisor) : null;
    project.supervisor = supervisor._id;
    await project.save();

    // Teams made while a proposal was unassigned inherit the accepted
    // supervisor so review and leader-confirmation permissions stay coherent.
    await Team.updateMany({ project: project._id }, { $set: { supervisor: supervisor._id } });

    await Promise.all([
      ...project.students.map((student) => notify({
        user: student,
        title: previousSupervisor ? 'Project supervisor updated' : 'Supervisor assigned',
        message: `${supervisor.name} is now supervising "${project.title}".`,
        type: 'info',
        link: '/proposals'
      })),
      previousSupervisor && previousSupervisor !== idOf(supervisor._id)
        ? notify({
          user: previousSupervisor,
          title: 'Project reassigned',
          message: `You are no longer the assigned supervisor for "${project.title}".`,
          type: 'info',
          link: '/supervisor-dashboard'
        })
        : Promise.resolve()
    ]);
    await recordAudit({
      actor: req.user.id,
      action: previousSupervisor ? 'project.supervisor_reassigned' : 'project.supervisor_assigned',
      entityType: 'project',
      entityId: project._id,
      metadata: { previousSupervisor, supervisor: supervisor._id }
    });

    res.json({ success: true, data: await populateProject(project._id) });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
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

    const permittedFields = ['title', 'description', 'status'];
    // Membership and ownership are deliberately immutable through this general
    // update route; the dedicated, authorization-checked membership workflow
    // is the only way to change a project team.
    const updates = Object.fromEntries(
      permittedFields
        .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (Object.keys(updates).length === 0) {
      return res.status(422).json({ success: false, error: 'No supported project fields were provided' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
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

    // Never silently leave academic records orphaned. Projects with activity
    // should be moved to on_hold/completed; an empty accidental project can be
    // deleted safely.
    const relatedCounts = await Promise.all([
      Task.countDocuments({ project: project._id }),
      Submission.countDocuments({ project: project._id }),
      Meeting.countDocuments({ project: project._id }),
      Team.countDocuments({ project: project._id }),
      ProposalVersion.countDocuments({ project: project._id }),
      Report.countDocuments({ project: project._id }),
      Review.countDocuments({ project: project._id }),
      ProgressLog.countDocuments({ project: project._id }),
      WorkspaceDocument.countDocuments({ project: project._id }),
      Resource.countDocuments({ project: project._id }),
      Message.countDocuments({ project: project._id }),
      Evaluation.countDocuments({ project: project._id }),
      PlagiarismReport.countDocuments({ project: project._id })
    ]);
    if (relatedCounts.some(Boolean)) {
      return res.status(409).json({
        success: false,
        error: 'This project has academic records and cannot be deleted. Set its status to on_hold or completed to preserve the audit trail.'
      });
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

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this project report' });
    }

    const [tasks, submissions, meetings] = await Promise.all([
      Task.find({ project: req.params.id }).populate('assignedTo', 'name').sort({ dueDate: 1 }),
      Submission.find({ project: req.params.id }).populate('student', 'name').sort({ submittedAt: -1 }),
      Meeting.find({ project: req.params.id }).sort({ date: -1 })
    ]);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => ['done', 'completed'].includes(t.status)).length;
    const pendingTasks = tasks.filter(t => ['todo', 'in_progress', 'review', 'blocked'].includes(t.status)).length;
    const delayedTasks = tasks.filter(t => t.isDelayed || (t.dueDate && t.dueDate < new Date() && !['done', 'completed', 'cancelled'].includes(t.status))).length;

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

    const isAssignedSupervisor = idOf(project.supervisor) === req.user.id;
    if (req.user.role !== 'admin' && !isAssignedSupervisor) {
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
