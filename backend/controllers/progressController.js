const ProgressLog = require('../models/ProgressLog');
const { Project, canAccessProject } = require('../utils/projectAccess');
const { recordAudit } = require('../services/auditService');

exports.getProgressLogs = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to view progress logs' });
    const logs = await ProgressLog.find({ project: project._id }).populate('author', 'name email').sort({ weekStart: -1, createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.createProgressLog = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to add a progress log' });
    const log = await ProgressLog.create({ ...req.body, project: project._id, author: req.user.id });
    await recordAudit({ actor: req.user.id, action: 'progress_log.created', entityType: 'progressLog', entityId: log._id, metadata: { project: project._id } });
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateProgressLog = async (req, res) => {
  try {
    const log = await ProgressLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false, error: 'Progress log not found' });
    const project = await Project.findById(log.project);
    if (!canAccessProject(project, req.user) || log.author.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Not authorized to edit this progress log' });
    if (log.state !== 'draft') return res.status(409).json({ success: false, error: 'Submitted progress logs are immutable' });
    for (const field of ['summary', 'blockers', 'evidence', 'weekStart']) if (Object.hasOwn(req.body, field)) log[field] = req.body[field];
    await log.save();
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.submitProgressLog = async (req, res) => {
  try {
    const log = await ProgressLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false, error: 'Progress log not found' });
    if (log.author.toString() !== req.user.id || log.state !== 'draft') return res.status(409).json({ success: false, error: 'Only the author may submit a draft progress log' });
    log.state = 'submitted';
    log.submittedAt = new Date();
    await log.save();
    await recordAudit({ actor: req.user.id, action: 'progress_log.submitted', entityType: 'progressLog', entityId: log._id, metadata: { project: log.project } });
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
