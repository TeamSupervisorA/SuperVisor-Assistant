const User = require('../models/User');
const Department = require('../models/Department');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Notification = require('../models/Notification');
const { recordAudit } = require('../services/auditService');

const ensureSupervisorCanChangeAccess = async (target) => {
  if (target.role !== 'supervisor') return;
  const supervisedCount = await Project.countDocuments({ supervisor: target._id });
  if (supervisedCount) {
    const error = new Error(`Reassign this supervisor's ${supervisedCount} project(s) before changing their access or role`);
    error.statusCode = 409;
    throw error;
  }
};

exports.getUsers = async (req, res) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {};
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
};

exports.setUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) return res.status(422).json({ success: false, error: 'Status must be active or inactive' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });
    if (status === 'inactive') await ensureSupervisorCanChangeAccess(target);
    if (target.role === 'admin' && status === 'inactive') {
      const activeAdmins = await User.countDocuments({ role: 'admin', status: { $ne: 'inactive' } });
      if (activeAdmins <= 1) return res.status(409).json({ success: false, error: 'The last active administrator cannot be deactivated' });
    }
    target.status = status;
    await target.save();
    await recordAudit({ actor: req.user.id, action: `user.${status === 'active' ? 'restored' : 'deactivated'}`, entityType: 'user', entityId: target._id, metadata: { targetRole: target.role } });
    res.json({ success: true, data: { id: target._id, status: target.status } });
  } catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
};

// Public registration intentionally creates students only. Administrators use
// this audited endpoint to provision or revoke supervisor access.
exports.setUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'supervisor'].includes(role)) return res.status(422).json({ success: false, error: 'Role must be student or supervisor' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });
    if (target.role === 'admin') return res.status(403).json({ success: false, error: 'Administrator roles cannot be changed through this endpoint' });
    if (target.role === 'supervisor' && role !== 'supervisor') await ensureSupervisorCanChangeAccess(target);
    const previousRole = target.role;
    target.role = role;
    await target.save();
    await recordAudit({ actor: req.user.id, action: 'user.role_changed', entityType: 'user', entityId: target._id, metadata: { previousRole, role } });
    res.json({ success: true, data: { id: target._id, role: target.role } });
  } catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
};

exports.getDepartments = async (req, res) => {
  try { res.json({ success: true, data: await Department.find().sort({ name: 1 }) }); }
  catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body);
    await recordAudit({ actor: req.user.id, action: 'department.created', entityType: 'department', entityId: department._id });
    res.status(201).json({ success: true, data: department });
  } catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
};

const notify = async (fields) => {
  try { await Notification.create(fields); } catch { /* notification delivery is non-critical */ }
};

exports.getSupervisionOverview = async (req, res) => {
  try {
    const [supervisors, projects, teams] = await Promise.all([
      User.find({ role: 'supervisor', status: 'active' })
        .select('name email department expertise maxActiveTeams')
        .sort({ name: 1 })
        .lean(),
      Project.find({ status: { $in: ['proposed', 'active', 'on_hold'] } })
        .select('title department section status proposalState supervisor students supervisionSource supervisorAssignedAt')
        .populate('supervisor', 'name department')
        .sort({ createdAt: -1 })
        .lean(),
      Team.find({ status: { $nin: ['completed', 'archived'] } })
        .select('name project status supervisor members')
        .lean()
    ]);
    const projectCount = new Map();
    const teamCount = new Map();
    projects.forEach((project) => {
      if (project.supervisor?._id) projectCount.set(String(project.supervisor._id), (projectCount.get(String(project.supervisor._id)) || 0) + 1);
    });
    teams.forEach((team) => {
      if (team.supervisor) teamCount.set(String(team.supervisor), (teamCount.get(String(team.supervisor)) || 0) + 1);
    });
    const teamsByProject = new Map();
    teams.forEach((team) => {
      const key = String(team.project);
      teamsByProject.set(key, [...(teamsByProject.get(key) || []), team]);
    });
    res.json({
      success: true,
      data: {
        supervisors: supervisors.map((supervisor) => ({
          ...supervisor,
          activeProjects: projectCount.get(String(supervisor._id)) || 0,
          activeTeams: teamCount.get(String(supervisor._id)) || 0
        })),
        projects: projects.map((project) => ({ ...project, teams: teamsByProject.get(String(project._id)) || [] }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Unable to load supervision allocation' });
  }
};

const assignSupervisorToProject = async ({ project, supervisor, actor, section, department }) => {
  const previousSupervisor = project.supervisor?._id || project.supervisor || null;
  project.supervisor = supervisor._id;
  if (typeof section === 'string') project.section = section.trim().slice(0, 80) || null;
  if (typeof department === 'string') project.department = department.trim().slice(0, 120) || null;
  project.supervisionSource = 'admin_assignment';
  project.supervisorAssignedAt = new Date();
  project.supervisorAssignedBy = actor;
  await project.save();
  const relatedTeams = await Team.find({ project: project._id });
  await Promise.all(relatedTeams.map(async (team) => {
    team.supervisor = supervisor._id;
    team.supervisorInvitations.forEach((invitation) => {
      if (invitation.status === 'pending') {
        invitation.status = 'cancelled';
        invitation.respondedAt = new Date();
      }
    });
    if (team.status === 'pending_approval') team.status = 'forming';
    await team.save();
  }));
  await Promise.all([
    notify({ user: supervisor._id, title: 'Supervision assignment', message: `You were assigned to supervise “${project.title}”.`, type: 'info', link: '/team' }),
    ...project.students.map((student) => notify({ user: student, title: 'Supervisor assigned', message: `${supervisor.name} is now supervising “${project.title}”.`, type: 'success', link: '/team' })),
    previousSupervisor && String(previousSupervisor) !== String(supervisor._id)
      ? notify({ user: previousSupervisor, title: 'Supervision reassigned', message: `“${project.title}” has been reassigned by an administrator.`, type: 'info', link: '/supervisor-dashboard' })
      : Promise.resolve()
  ]);
  await recordAudit({
    actor,
    action: previousSupervisor ? 'project.supervisor_reassigned' : 'project.supervisor_assigned',
    entityType: 'project',
    entityId: project._id,
    metadata: { previousSupervisor, supervisor: supervisor._id, section: project.section, department: project.department, source: 'admin_assignment' }
  });
  return project;
};

exports.assignProjectSupervisor = async (req, res) => {
  try {
    const [project, supervisor] = await Promise.all([
      Project.findById(req.params.projectId),
      User.findOne({ _id: req.body?.supervisorId, role: 'supervisor', status: 'active' }).select('name')
    ]);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!supervisor) return res.status(422).json({ success: false, error: 'Choose an active supervisor account' });
    await assignSupervisorToProject({ project, supervisor, actor: req.user.id, section: req.body?.section, department: req.body?.department });
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.assignTeamSupervisor = async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });
    req.params.projectId = team.project;
    return exports.assignProjectSupervisor(req, res);
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};
