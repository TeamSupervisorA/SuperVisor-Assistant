const User = require('../models/User');
const Department = require('../models/Department');
const Institution = require('../models/Institution');
const Project = require('../models/Project');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { recordAudit } = require('../services/auditService');

const sameAdminInstitution = (admin, target) => String(admin.institution || 'legacy') === String(target.institution || 'legacy');

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
    const query = { institution: req.user.institution || null };
    if (req.query.status) query.status = req.query.status;
    const users = await User.find(query).select('-password').populate('institution', 'name slug').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
};

exports.setUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) return res.status(422).json({ success: false, error: 'Status must be active or inactive' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });
    if (!sameAdminInstitution(req.user, target)) return res.status(403).json({ success: false, error: 'Administrators can manage accounts only in their own institution' });
    if (status === 'inactive') await ensureSupervisorCanChangeAccess(target);
    if (target.role === 'admin' && status === 'inactive') {
      const activeAdmins = await User.countDocuments({ institution: target.institution || null, role: 'admin', status: { $ne: 'inactive' } });
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
    if (!sameAdminInstitution(req.user, target)) return res.status(403).json({ success: false, error: 'Administrators can manage accounts only in their own institution' });
    if (target.role === 'admin') return res.status(403).json({ success: false, error: 'Administrator roles cannot be changed through this endpoint' });
    if (target.role === 'supervisor' && role !== 'supervisor') await ensureSupervisorCanChangeAccess(target);
    if (target.role === 'student' && role === 'supervisor') {
      const membershipCount = await Project.countDocuments({ students: target._id });
      if (membershipCount) return res.status(409).json({ success: false, error: `Remove this student from ${membershipCount} project roster(s) before granting supervisor access` });
    }
    const previousRole = target.role;
    target.role = role;
    await target.save();
    await recordAudit({ actor: req.user.id, action: 'user.role_changed', entityType: 'user', entityId: target._id, metadata: { previousRole, role } });
    res.json({ success: true, data: { id: target._id, role: target.role } });
  } catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
};

exports.getDepartments = async (req, res) => {
  try { res.json({ success: true, data: await Department.find({ institution: req.user.institution || null }).sort({ name: 1 }) }); }
  catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.createDepartment = async (req, res) => {
  try {
    const department = await Department.create({ code: req.body?.code, name: req.body?.name, institution: req.user.institution || null });
    await recordAudit({ actor: req.user.id, action: 'department.created', entityType: 'department', entityId: department._id });
    res.status(201).json({ success: true, data: department });
  } catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
};

exports.getInstitutions = async (req, res) => {
  try {
    const query = req.user.institution ? { _id: req.user.institution } : {};
    res.json({ success: true, data: await Institution.find(query).sort({ name: 1 }) });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.createInstitution = async (req, res) => {
  try {
    if (req.user.institution) return res.status(409).json({ success: false, error: 'This administrator already belongs to an institution' });
    const name = String(req.body?.name || '').trim();
    const slug = String(req.body?.slug || '').trim().toLowerCase();
    if (!name || !slug) return res.status(422).json({ success: false, error: 'Institution name and slug are required' });
    const emailDomains = [...new Set((req.body?.emailDomains || []).map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
    if (emailDomains.some((domain) => !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain))) {
      return res.status(422).json({ success: false, error: 'Institution email domains must be host names such as university.edu' });
    }
    const institution = await Institution.create({ name, slug, emailDomains, createdBy: req.user.id });
    req.user.institution = institution._id;
    await req.user.save({ validateBeforeSave: false });
    await Promise.all([
      User.updateMany({ institution: null, _id: { $ne: req.user.id } }, { $set: { institution: institution._id } }),
      Project.updateMany({ institution: null }, { $set: { institution: institution._id } }),
      Department.updateMany({ institution: null }, { $set: { institution: institution._id } }),
      Course.updateMany({ institution: null }, { $set: { institution: institution._id } })
    ]);
    await recordAudit({ actor: req.user.id, action: 'institution.created', entityType: 'institution', entityId: institution._id });
    res.status(201).json({ success: true, data: institution });
  } catch (error) { res.status(error?.code === 11000 ? 409 : 400).json({ success: false, error: error?.code === 11000 ? 'That institution slug or department code is already in use' : error.message }); }
};

exports.assignUserInstitution = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });
    const institutionId = req.body?.institutionId || req.user.institution;
    if (!institutionId) return res.status(422).json({ success: false, error: 'Create an institution before provisioning accounts' });
    if (req.user.institution && String(req.user.institution) !== String(institutionId)) return res.status(403).json({ success: false, error: 'Administrators can provision accounts only inside their own institution' });
    const institution = await Institution.findOne({ _id: institutionId, status: 'active' });
    if (!institution) return res.status(422).json({ success: false, error: 'Choose an active institution' });
    let department = null;
    if (req.body?.departmentId) {
      department = await Department.findOne({ _id: req.body.departmentId, institution: institution._id, status: 'active' });
      if (!department) return res.status(422).json({ success: false, error: 'Choose a department controlled by this institution' });
    }
    const previousInstitution = target.institution;
    target.institution = institution._id;
    target.departmentRef = department?._id || null;
    if (department) target.department = department.name;
    await target.save({ validateBeforeSave: false });
    await recordAudit({ actor: req.user.id, action: 'user.institution_assigned', entityType: 'user', entityId: target._id, metadata: { previousInstitution, institution: institution._id, department: department?._id || null } });
    res.json({ success: true, data: target });
  } catch (error) { res.status(error.statusCode || 400).json({ success: false, error: error.message }); }
};

const notify = async (fields) => {
  try { await Notification.create(fields); } catch { /* notification delivery is non-critical */ }
};

exports.getSupervisionOverview = async (req, res) => {
  try {
    const [supervisors, projects] = await Promise.all([
      User.find({ institution: req.user.institution || null, role: 'supervisor', status: 'active' })
        .select('name email department expertise maxActiveTeams')
        .sort({ name: 1 })
        .lean(),
      Project.find({ institution: req.user.institution || null, status: { $in: ['draft', 'awaiting_supervisor', 'awaiting_approval', 'proposed', 'active', 'on_hold'] } })
        .select('title department section status proposalState supervisor students leaderUserId supervisionSource supervisorAssignedAt')
        .populate('supervisor', 'name department')
        .sort({ createdAt: -1 })
        .lean()
    ]);
    const projectCount = new Map();
    projects.forEach((project) => {
      if (project.supervisor?._id) projectCount.set(String(project.supervisor._id), (projectCount.get(String(project.supervisor._id)) || 0) + 1);
    });
    res.json({
      success: true,
      data: {
        supervisors: supervisors.map((supervisor) => ({
          ...supervisor,
          activeProjects: projectCount.get(String(supervisor._id)) || 0
        })),
        projects
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Unable to load supervision allocation' });
  }
};

const assignSupervisorToProject = async ({ project, supervisor, actor, section, department }) => {
  const previousSupervisor = project.supervisor?._id || project.supervisor || null;
  const activeHistory = project.supervisorHistory?.find((entry) => !entry.endedAt);
  if (activeHistory && String(activeHistory.supervisor) !== String(supervisor._id)) {
    activeHistory.endedAt = new Date();
    activeHistory.endReason = 'Reassigned by institution administrator';
  }
  project.supervisor = supervisor._id;
  if (typeof section === 'string') project.section = section.trim().slice(0, 80) || null;
  if (typeof department === 'string') project.department = department.trim().slice(0, 120) || null;
  project.supervisionSource = 'admin_assignment';
  if (['draft', 'awaiting_supervisor', 'proposed'].includes(project.status)) project.status = project.proposalState === 'approved' ? 'active' : 'awaiting_approval';
  project.supervisorAssignedAt = new Date();
  project.supervisorAssignedBy = actor;
  if (!activeHistory || String(activeHistory.supervisor) !== String(supervisor._id)) {
    project.supervisorHistory.push({ supervisor: supervisor._id, assignedBy: actor, source: 'admin_assignment', startedAt: project.supervisorAssignedAt });
  }
  await project.save();
  project.supervisorInvitations?.forEach((invitation) => {
    if (invitation.state === 'pending') {
      invitation.state = 'cancelled';
      invitation.respondedAt = new Date();
    }
  });
  await project.save();
  await Promise.all([
    notify({ user: supervisor._id, title: 'Supervision assignment', message: `You were assigned to supervise “${project.title}”.`, type: 'info', link: '/team-management' }),
    ...project.students.map((student) => notify({ user: student, title: 'Supervisor assigned', message: `${supervisor.name} is now supervising “${project.title}”.`, type: 'success', link: '/team-management' })),
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
      User.findOne({ _id: req.body?.supervisorId, role: 'supervisor', status: 'active', institution: req.user.institution || null }).select('name institution')
    ]);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!supervisor) return res.status(422).json({ success: false, error: 'Choose an active supervisor account' });
    if (String(project.institution || 'legacy') !== String(req.user.institution || 'legacy') || String(supervisor.institution || 'legacy') !== String(req.user.institution || 'legacy')) return res.status(403).json({ success: false, error: 'Project and supervisor must belong to your institution' });
    await assignSupervisorToProject({ project, supervisor, actor: req.user.id, section: req.body?.section, department: req.body?.department });
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};
