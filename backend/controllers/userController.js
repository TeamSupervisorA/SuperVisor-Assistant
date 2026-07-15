const User = require('../models/User');

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
    
    // Update settings object
    user.settings = { ...user.settings, ...req.body };
    await user.save();
    
    res.status(200).json({ success: true, data: user.settings });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
