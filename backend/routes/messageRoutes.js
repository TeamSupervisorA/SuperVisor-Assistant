const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { sendServerError } = require('../utils/errorResponse');
const { canAccessProject } = require('../utils/projectAccess');
const { recordAudit } = require('../services/auditService');
const Resource = require('../models/Resource');
const Submission = require('../models/Submission');
const Task = require('../models/Task');
const ProposalVersion = require('../models/ProposalVersion');
const Meeting = require('../models/Meeting');

const referenceModels = { resource: Resource, submission: Submission, task: Task, proposal: ProposalVersion, meeting: Meeting };

const validateReferences = async (references, projectId) => {
  if (!Array.isArray(references)) return [];
  if (references.length > 10) {
    const error = new Error('A message can reference at most 10 project records');
    error.statusCode = 422;
    throw error;
  }
  const normalized = references.map((reference) => ({ kind: reference.kind, entityId: reference.entityId, label: String(reference.label || '').trim().slice(0, 180) }));
  for (const reference of normalized) {
    const Model = referenceModels[reference.kind];
    if (!Model || !reference.entityId || !(await Model.exists({ _id: reference.entityId, project: projectId }))) {
      const error = new Error('Every chat reference must identify a record from this project');
      error.statusCode = 422;
      throw error;
    }
  }
  return normalized;
};

// Only project members (students/supervisor) or admins may access a project's chat
const getAccessibleProject = async (projectId, user) => {
  const project = await Project.findById(projectId).select('supervisor students status institution');
  if (!project) return null;
  return canAccessProject(project, user) ? project : null;
};

router.get('/:projectId', protect, async (req, res) => {
  try {
    if (!(await getAccessibleProject(req.params.projectId, req.user))) {
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

    const accessibleProject = await getAccessibleProject(project, req.user);
    if (!accessibleProject) {
      return res.status(403).json({ success: false, error: 'Not authorized to post in this project chat' });
    }
    if (accessibleProject.status !== 'active') {
      return res.status(409).json({ success: false, error: 'Project chat opens when the approved project becomes active' });
    }

    const references = await validateReferences(req.body.references, project);
    const message = await Message.create({
      project,
      content: content.trim(),
      sender: req.user._id,
      references
    });
    await recordAudit({ actor: req.user.id, action: 'chat.message_created', entityType: 'message', entityId: message._id, metadata: { project, referenceCount: references.length } });
    
    await message.populate('sender', 'name email role');
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ success: false, error: error.message });
    return sendServerError(res, error, 'Unable to send this message');
  }
});

module.exports = router;
