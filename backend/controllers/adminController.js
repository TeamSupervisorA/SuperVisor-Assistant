const User = require('../models/User');
const Department = require('../models/Department');
const { recordAudit } = require('../services/auditService');

exports.getUsers = async (req, res) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {};
    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.setUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) return res.status(422).json({ success: false, error: 'Status must be active or inactive' });
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'User not found' });
    if (target.role === 'admin' && status === 'inactive') {
      const activeAdmins = await User.countDocuments({ role: 'admin', status: { $ne: 'inactive' } });
      if (activeAdmins <= 1) return res.status(409).json({ success: false, error: 'The last active administrator cannot be deactivated' });
    }
    target.status = status;
    await target.save();
    await recordAudit({ actor: req.user.id, action: `user.${status === 'active' ? 'restored' : 'deactivated'}`, entityType: 'user', entityId: target._id, metadata: { targetRole: target.role } });
    res.json({ success: true, data: { id: target._id, status: target.status } });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
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
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};
