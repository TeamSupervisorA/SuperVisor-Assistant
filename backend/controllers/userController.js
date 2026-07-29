const User = require('../models/User');

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
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update user settings
exports.updateSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    const allowed = ['aiChatbot', 'ideaGenerator', 'proposalFeedback', 'plagiarismAutoCheck', 'systemPrompt', 'plagiarismTolerance'];
    const settings = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) settings[key] = req.body[key]; });
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
