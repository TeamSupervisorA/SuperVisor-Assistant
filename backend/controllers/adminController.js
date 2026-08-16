const User = require('../models/User');
const Department = require('../models/Department');
const Project = require('../models/Project');
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
