const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { sendServerError } = require('../utils/errorResponse');

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
    return sendServerError(res, error, 'Unable to load project messages');
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { project, content } = req.body;
    if (typeof content !== 'string' || !content.trim()) {
      return res.status(422).json({ success: false, error: 'A chat message cannot be empty' });
    }
    if (content.trim().length > 5000) {
      return res.status(422).json({ success: false, error: 'A chat message cannot exceed 5,000 characters' });
    }

    if (!(await canAccessProject(project, req.user))) {
      return res.status(403).json({ success: false, error: 'Not authorized to post in this project chat' });
    }

    const message = await Message.create({
      project,
      content: content.trim(),
      sender: req.user._id
    });
    
    await message.populate('sender', 'name email role');
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    return sendServerError(res, error, 'Unable to send this message');
  }
});

module.exports = router;
