const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// Only project members (students/supervisor) or admins may access a project's chat
const canAccessProject = async (projectId, user) => {
  if (user.role === 'admin') return true;
  const project = await Project.findById(projectId).select('supervisor students');
  if (!project) return false;
  if (project.supervisor && project.supervisor.toString() === user.id) return true;
  return project.students.some(s => s.toString() === user.id);
};

router.get('/:projectId', protect, async (req, res) => {
  try {
    if (!(await canAccessProject(req.params.projectId, req.user))) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this project chat' });
    }

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

    if (!(await canAccessProject(project, req.user))) {
      return res.status(403).json({ success: false, error: 'Not authorized to post in this project chat' });
    }

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
