const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

router.get('/:projectId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ project: req.params.projectId })
      .populate('sender', 'name email role')
      .sort('createdAt');
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { project, content } = req.body;
    const message = await Message.create({
      project,
      content,
      sender: req.user._id
    });
    
    await message.populate('sender', 'name email role');
    
    // We already emit via socket on the client, but if we wanted to emit from server:
    // req.app.get('io').to(project).emit('receive_message', message);
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
