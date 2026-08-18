const User = require('../models/User');
const { sendServerError } = require('../utils/errorResponse');

const publicProfile = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, studentId: user.studentId, batch: user.batch });

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });
  res.json({ success: true, data: publicProfile(user) });
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    ['name', 'department', 'studentId', 'batch'].forEach((field) => {
      if (typeof req.body[field] === 'string') user[field] = req.body[field].trim();
    });
    await user.save();
    res.json({ success: true, data: publicProfile(user) });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

// Get user settings
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: user.settings });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load user settings');
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const allowed = ['aiChatbot', 'ideaGenerator', 'proposalFeedback', 'systemPrompt'];
    const integrityKeys = ['plagiarismAutoCheck', 'plagiarismTolerance'];
    if (integrityKeys.some((key) => req.body[key] !== undefined)) {
      if (req.user.role !== 'supervisor') {
        return res.status(403).json({ success: false, error: 'Only supervisors can configure automatic integrity screening' });
      }
      allowed.push(...integrityKeys);
    }
    const settings = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) settings[key] = req.body[key]; });
    for (const key of ['aiChatbot', 'ideaGenerator', 'proposalFeedback', 'plagiarismAutoCheck']) {
      if (settings[key] !== undefined && typeof settings[key] !== 'boolean') {
        return res.status(422).json({ success: false, error: `${key} must be true or false` });
      }
    }
    if (typeof settings.systemPrompt === 'string' && settings.systemPrompt.length > 4000) {
      return res.status(422).json({ success: false, error: 'System prompt must be 4000 characters or fewer' });
    }
    if (settings.plagiarismTolerance !== undefined && (!Number.isFinite(settings.plagiarismTolerance) || settings.plagiarismTolerance < 0 || settings.plagiarismTolerance > 100)) {
      return res.status(422).json({ success: false, error: 'Plagiarism tolerance must be between 0 and 100' });
    }
    user.settings = { ...user.settings, ...settings };
    await user.save();
    
    res.status(200).json({ success: true, data: user.settings });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update user password (or setup for Google users)
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    const { currentPassword, newPassword } = req.body;
    
    // If the user already has a password, verify the current one
    if (user.password) {
      if (!currentPassword) {
        return res.status(422).json({ success: false, error: 'Current password is required to change your password' });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Incorrect current password' });
      }
    }
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(422).json({ success: false, error: 'New password must be at least 8 characters long' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
