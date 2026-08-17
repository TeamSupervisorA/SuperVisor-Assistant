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
const AuditLog = require('../models/AuditLog');
const { taskMetrics, projectHealth, projectCapabilities } = require('../utils/projectWorkflow');

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
  .populate('students', 'name email department')
  .populate('leaderUserId', 'name email')
  .populate('memberInvitations.user', 'name email')
  .populate('memberInvitations.invitedBy', 'name')
  .populate('supervisorInvitations.supervisor', 'name email department expertise maxActiveTeams')
  .populate('supervisorInvitations.invitedBy', 'name');

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
      .populate('students', 'name email department')
      .populate('leaderUserId', 'name email');

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
      filters.push({ supervisor: req.user.id });
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
    const project = await populateProject(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this project' });
    }

    res.status(200).json({ success: true, data: project, capabilities: projectCapabilities(project, req.user) });
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
      description,
      department: String(req.body?.department || req.user.department || '').trim() || null,
      section: String(req.body?.section || '').trim() || null
    };

    if (req.user.role === 'student') {
      projectData.students = [req.user.id];
      projectData.leaderUserId = req.user.id;
      projectData.supervisor = null; // To be assigned later
      // A student-created project enters the proposal workflow. A supervisor
      // or administrator controls any later lifecycle state change.
      projectData.status = 'awaiting_supervisor';
      projectData.supervisionSource = 'unassigned';
    } else {
      projectData.students = await activeStudentIds(students || []);
      projectData.leaderUserId = projectData.students[0] || null;
      // A connected supervisor does not bypass academic approval. The first
      // student owns Proposal Version 1 and approval is the only activation
      // path. A project with no roster stays in draft until a student joins.
      projectData.status = projectData.leaderUserId ? 'awaiting_approval' : 'draft';

      if (req.user.role === 'supervisor') {
        projectData.supervisor = req.user.id;
        projectData.supervisionSource = 'supervisor_claim';
        projectData.supervisorAssignedAt = new Date();
        projectData.supervisorAssignedBy = req.user.id;
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
        projectData.supervisionSource = 'admin_assignment';
        projectData.supervisorAssignedAt = new Date();
        projectData.supervisorAssignedBy = req.user.id;
      }
    }

    const project = await Project.create(projectData);
    try {
      await ProposalVersion.create({
        project: project._id,
        versionNo: 1,
        title: project.title,
        content: String(req.body?.proposalContent || project.description || 'Start the first proposal draft here.').trim(),
        state: 'draft',
        createdBy: project.leaderUserId || req.user.id
      });
    } catch (proposalError) {
      await Project.deleteOne({ _id: project._id });
      throw new Error(`Project creation was rolled back because Proposal Version 1 could not be created: ${proposalError.message}`);
    }
    await recordAudit({ actor: req.user.id, action: 'project.created', entityType: 'project', entityId: project._id, metadata: { proposalVersion: 1 } });

    res.status(201).json({ success: true, data: await populateProject(project._id) });
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
    project.supervisionSource = req.user.role === 'admin' ? 'admin_assignment' : 'supervisor_claim';
    project.supervisorAssignedAt = new Date();
    project.supervisorAssignedBy = req.user.id;
    if (['draft', 'awaiting_supervisor', 'proposed'].includes(project.status)) {
      project.status = project.proposalState === 'approved' ? 'active' : 'awaiting_approval';
    }
    await project.save();

    // Teams made while a proposal was unassigned inherit the accepted
    // supervisor so review and leader-confirmation permissions stay coherent.
    const relatedTeams = await Team.find({ project: project._id });
    await Promise.all(relatedTeams.map(async (team) => {
      team.supervisor = supervisor._id;
      team.supervisorInvitations?.forEach((invitation) => {
        if (invitation.status === 'pending') {
          invitation.status = 'cancelled';
          invitation.respondedAt = new Date();
        }
      });
      if (team.status === 'pending_approval') team.status = 'forming';
      await team.save();
    }));

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

    const capabilities = projectCapabilities(project, req.user);
    if (!capabilities.isAdmin && !capabilities.isSupervisor && !capabilities.isLeader) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this project' });
    }

    if (capabilities.isLeader && !capabilities.isAdmin && !capabilities.isSupervisor && !['draft', 'awaiting_supervisor'].includes(project.status)) {
      return res.status(409).json({ success: false, error: 'The project summary is locked after it enters supervisor approval' });
    }
    if (Object.hasOwn(req.body, 'status') && !capabilities.isAdmin && !capabilities.isSupervisor) {
      return res.status(403).json({ success: false, error: 'Only the assigned supervisor or an administrator can change project status' });
    }
    const permittedFields = capabilities.isAdmin || capabilities.isSupervisor
      ? ['title', 'description', 'status']
      : ['title', 'description'];
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

    if (updates.status && updates.status !== project.status) {
      const allowedTransitions = {
        draft: ['awaiting_supervisor', 'archived'],
        awaiting_supervisor: ['awaiting_approval', 'on_hold', 'archived'],
        awaiting_approval: ['on_hold', 'archived'],
        proposed: ['awaiting_supervisor', 'awaiting_approval', 'on_hold', 'archived'],
        active: ['on_hold', 'completed', 'archived'],
        on_hold: ['active', 'archived'],
        completed: ['archived'],
        archived: []
      };
      if (!allowedTransitions[project.status]?.includes(updates.status)) {
        return res.status(422).json({ success: false, error: `Project status cannot move directly from ${project.status} to ${updates.status}. Proposal approval is required to activate a pending project.` });
      }
    }

    const before = { title: project.title, description: project.description, status: project.status };
    Object.assign(project, updates);
    await project.save();
    await recordAudit({ actor: req.user.id, action: 'project.updated', entityType: 'project', entityId: project._id, metadata: { before, after: updates } });

    res.status(200).json({ success: true, data: await populateProject(project._id) });
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

    const metrics = taskMetrics(tasks);
    const { total: totalTasks, completed: completedTasks, pending: pendingTasks, overdue: delayedTasks, progressPercentage } = metrics;

    const gradedCount = submissions.filter(s => s.status === 'Graded').length;
    const healthAssessment = projectHealth({ project, tasks, submissions });
    const health = healthAssessment.label;

    const summary = totalTasks === 0
      ? `"${project.title}" has no tasks defined yet. Break the project into tasks and milestones to start tracking progress.`
      : `"${project.title}" is ${progressPercentage}% complete: ${completedTasks} of ${totalTasks} tasks are done, ` +
        `${pendingTasks} in progress or pending, and ${delayedTasks} delayed. ` +
        `${submissions.length} deliverable${submissions.length === 1 ? '' : 's'} submitted (${gradedCount} graded). ` +
        `Overall status: ${health}${healthAssessment.reasons.length ? ` (${healthAssessment.reasons.join('; ')})` : ''}.`;

    const report = {
      projectTitle: project.title,
      description: project.description,
      status: project.status,
      health,
      healthReasons: healthAssessment.reasons,
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

    const capabilities = projectCapabilities(project, req.user);
    if (!capabilities.canInviteStudents) {
      return res.status(403).json({ success: false, error: 'Only the project leader, assigned supervisor, or an administrator can invite students' });
    }

    const newMember = await User.findOne({ email: email.toLowerCase().trim() });
    if (!newMember) {
      return res.status(404).json({ success: false, error: 'No user found with that email' });
    }
    if (newMember.role !== 'student' || newMember.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Only active student accounts can be added as team members' });
    }
    if (project.students.some(s => idOf(s) === newMember.id)) {
      return res.status(400).json({ success: false, error: 'This student is already on the team' });
    }

    const existingPending = project.memberInvitations.find((invitation) => invitation.email === newMember.email && invitation.state === 'pending');
    if (existingPending) return res.status(409).json({ success: false, error: 'This student already has a pending invitation' });
    project.memberInvitations.push({ email: newMember.email, user: newMember._id, invitedBy: req.user.id });
    await project.save();

    // Best-effort notification — team change should not fail if this does
    try {
      await Notification.create({
        user: newMember._id,
        title: 'Project invitation',
        message: `${req.user.name} invited you to join "${project.title}".`,
        type: 'info',
        link: '/team-management'
      });
    } catch (e) { /* non-fatal */ }

    const populated = await populateProject(project._id);

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
    const capabilities = projectCapabilities(project, req.user);
    if (!capabilities.canManageRoster && !isSelf) {
      return res.status(403).json({ success: false, error: 'Not authorized to remove this member' });
    }

    if (!project.students.some(s => idOf(s) === req.params.userId)) {
      return res.status(404).json({ success: false, error: 'That user is not on this team' });
    }
    if (idOf(project.leaderUserId || project.students[0]) === req.params.userId) {
      return res.status(409).json({ success: false, error: 'The project leader cannot leave or be removed until leadership is transferred' });
    }

    project.students = project.students.filter(s => idOf(s) !== req.params.userId);
    await project.save();

    const populated = await populateProject(project._id);

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// A student explicitly accepts or declines a project membership invitation.
exports.respondToMemberInvitation = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const invitation = project.memberInvitations.id(req.params.invitationId);
    if (!invitation || invitation.state !== 'pending') return res.status(404).json({ success: false, error: 'Pending invitation not found' });
    if (req.user.role !== 'student' || (idOf(invitation.user) !== req.user.id && invitation.email !== req.user.email)) {
      return res.status(403).json({ success: false, error: 'This invitation belongs to another student' });
    }
    const decision = req.body?.decision;
    if (!['accept', 'decline'].includes(decision)) return res.status(422).json({ success: false, error: 'Decision must be accept or decline' });
    invitation.state = decision === 'accept' ? 'accepted' : 'declined';
    invitation.respondedAt = new Date();
    if (decision === 'accept' && !project.students.some((student) => idOf(student) === req.user.id)) {
      project.students.push(req.user.id);
      if (!project.leaderUserId) {
        project.leaderUserId = req.user.id;
        if (project.supervisor && project.status === 'draft') project.status = 'awaiting_approval';
        await ProposalVersion.updateOne(
          { project: project._id, versionNo: 1, state: 'draft' },
          { $set: { createdBy: req.user.id } }
        );
      }
    }
    await project.save();
    await recordAudit({ actor: req.user.id, action: `project.member_${invitation.state}`, entityType: 'project', entityId: project._id, metadata: { invitationId: invitation._id } });
    res.json({ success: true, data: await populateProject(project._id) });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.inviteProjectSupervisor = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!projectCapabilities(project, req.user).canInviteSupervisor) return res.status(403).json({ success: false, error: 'Only the project leader or an administrator can invite a supervisor to an unassigned project' });
    const supervisor = await User.findOne({ _id: req.body?.supervisorId, role: 'supervisor', status: 'active' });
    if (!supervisor) return res.status(422).json({ success: false, error: 'Choose an active supervisor' });
    const activeProjectCount = await Project.countDocuments({ supervisor: supervisor._id, status: { $in: ['awaiting_approval', 'active', 'on_hold'] } });
    if (activeProjectCount >= (supervisor.maxActiveTeams || 6)) return res.status(409).json({ success: false, error: 'This supervisor is currently at project capacity' });
    if (project.supervisorInvitations.some((item) => idOf(item.supervisor) === supervisor.id && item.state === 'pending')) return res.status(409).json({ success: false, error: 'This supervisor already has a pending invitation' });
    project.supervisorInvitations.push({ supervisor: supervisor._id, invitedBy: req.user.id, message: String(req.body?.message || '').trim() });
    await project.save();
    await notify({ user: supervisor._id, title: 'Supervision invitation', message: `${req.user.name} invited you to supervise "${project.title}".`, type: 'info', link: '/team-management' });
    res.status(201).json({ success: true, data: await populateProject(project._id) });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.getMyProjectInvitations = async (req, res) => {
  try {
    const query = req.user.role === 'supervisor'
      ? { supervisorInvitations: { $elemMatch: { supervisor: req.user.id, state: 'pending' } } }
      : { memberInvitations: { $elemMatch: { $or: [{ user: req.user.id }, { email: req.user.email }], state: 'pending' } } };
    const projects = await Project.find(query).populate('students', 'name department').populate('leaderUserId', 'name').populate('supervisorInvitations.invitedBy', 'name').populate('memberInvitations.invitedBy', 'name');
    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.respondToSupervisorInvitation = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const invitation = project.supervisorInvitations.id(req.params.invitationId);
    if (!invitation || invitation.state !== 'pending') return res.status(404).json({ success: false, error: 'Pending invitation not found' });
    if (req.user.role !== 'supervisor' || idOf(invitation.supervisor) !== req.user.id) return res.status(403).json({ success: false, error: 'This invitation belongs to another supervisor' });
    const decision = req.body?.decision;
    if (!['accept', 'decline'].includes(decision)) return res.status(422).json({ success: false, error: 'Decision must be accept or decline' });
    invitation.state = decision === 'accept' ? 'accepted' : 'declined';
    invitation.respondedAt = new Date();
    if (decision === 'accept') {
      if (project.supervisor && idOf(project.supervisor) !== req.user.id) return res.status(409).json({ success: false, error: 'Another supervisor is already assigned' });
      const supervisor = await User.findById(req.user.id).select('maxActiveTeams');
      const activeProjectCount = await Project.countDocuments({ supervisor: req.user.id, status: { $in: ['awaiting_approval', 'active', 'on_hold'] }, _id: { $ne: project._id } });
      if (activeProjectCount >= (supervisor?.maxActiveTeams || 6)) return res.status(409).json({ success: false, error: 'Your supervision capacity is full. Decline this invitation or ask an administrator to reallocate work.' });
      project.supervisor = req.user.id;
      project.supervisionSource = 'student_invitation';
      project.supervisorAssignedAt = new Date();
      project.supervisorAssignedBy = invitation.invitedBy;
      project.status = project.proposalState === 'approved' ? 'active' : 'awaiting_approval';
      project.supervisorInvitations.forEach((item) => { if (item.id !== invitation.id && item.state === 'pending') item.state = 'cancelled'; });
    }
    await project.save();
    await recordAudit({ actor: req.user.id, action: `project.supervisor_invitation_${invitation.state}`, entityType: 'project', entityId: project._id, metadata: { invitationId: invitation._id } });
    res.json({ success: true, data: await populateProject(project._id) });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.transferProjectLeadership = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const capabilities = projectCapabilities(project, req.user);
    if (!(capabilities.isAdmin || capabilities.isLeader || capabilities.isSupervisor)) return res.status(403).json({ success: false, error: 'Only the current leader, assigned supervisor, or administrator can transfer leadership' });
    const nextLeaderId = String(req.body?.userId || '');
    if (!project.students.some((student) => idOf(student) === nextLeaderId)) return res.status(422).json({ success: false, error: 'The new leader must be an active project student' });
    const previousLeader = idOf(project.leaderUserId || project.students[0]);
    if (previousLeader === nextLeaderId) return res.status(409).json({ success: false, error: 'This student is already the project leader' });
    project.leaderUserId = nextLeaderId;
    await project.save();
    await recordAudit({ actor: req.user.id, action: 'project.leadership_transferred', entityType: 'project', entityId: project._id, metadata: { previousLeader, nextLeader: nextLeaderId } });
    res.json({ success: true, data: await populateProject(project._id) });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.getProjectAuditHistory = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to view this project history' });
    const relatedIds = await Promise.all([
      ProposalVersion.find({ project: project._id }).distinct('_id'),
      Task.find({ project: project._id }).distinct('_id'),
      Report.find({ project: project._id }).distinct('_id'),
      ProgressLog.find({ project: project._id }).distinct('_id')
    ]);
    const history = await AuditLog.find({
      $or: [
        { entityType: 'project', entityId: project._id },
        { entityType: 'proposalVersion', entityId: { $in: relatedIds[0] } },
        { entityType: 'task', entityId: { $in: relatedIds[1] } },
        { entityType: 'report', entityId: { $in: relatedIds[2] } },
        { entityType: 'progressLog', entityId: { $in: relatedIds[3] } }
      ]
    }).populate('actor', 'name role').sort({ occurredAt: -1 }).limit(200).lean();
    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
