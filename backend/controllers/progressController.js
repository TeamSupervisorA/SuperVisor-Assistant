const ProgressLog = require('../models/ProgressLog');
const { Project, canAccessProject } = require('../utils/projectAccess');
const { recordAudit } = require('../services/auditService');
const Notification = require('../models/Notification');

const notify = async (fields) => {
  try { await Notification.create(fields); } catch { /* a notification never blocks an academic record */ }
};

exports.getProgressLogs = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to view progress logs' });
    const logs = await ProgressLog.find({ project: project._id })
      .populate('author', 'name email')
      .populate('supervisorResponse.respondedBy', 'name role')
      .sort({ weekStart: -1, createdAt: -1 });
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.createProgressLog = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, error: 'Only project students can create weekly progress logs' });
    }
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to add a progress log' });
    if (project.status !== 'active') return res.status(409).json({ success: false, error: 'Weekly progress logging opens when the approved project becomes active' });
    // State, author, project and timestamps are workflow-owned fields. A
    // client can create only an editable draft; submission is explicit.
    const data = {};
    for (const field of ['weekStart', 'summary', 'blockers', 'evidence']) {
      if (Object.hasOwn(req.body, field)) data[field] = req.body[field];
    }
    const log = await ProgressLog.create({ ...data, project: project._id, author: req.user.id, state: 'draft' });
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
    const project = await Project.findById(log.project);
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to submit this progress log' });
    if (log.author.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Only the author may submit this progress log' });
    if (log.state !== 'draft') return res.status(409).json({ success: false, error: 'Only draft progress logs can be submitted' });
    log.state = 'submitted';
    log.submittedAt = new Date();
    await log.save();
    if (project?.supervisor && project.supervisor.toString() !== req.user.id) {
      await notify({
        user: project.supervisor,
        title: 'Progress update submitted',
        message: `${req.user.name} submitted a weekly progress update for "${project.title}".`,
        type: 'info',
        link: '/progress-logs'
      });
    }
    await recordAudit({ actor: req.user.id, action: 'progress_log.submitted', entityType: 'progressLog', entityId: log._id, metadata: { project: log.project } });
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.respondToProgressLog = async (req, res) => {
  try {
    const log = await ProgressLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false, error: 'Progress log not found' });
    const project = await Project.findById(log.project);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const isAssignedSupervisor = req.user.role === 'supervisor' && project.supervisor?.toString() === req.user.id;
    if (req.user.role !== 'admin' && !isAssignedSupervisor) return res.status(403).json({ success: false, error: 'Only the assigned supervisor can respond to this progress log' });
    if (log.state !== 'submitted') return res.status(409).json({ success: false, error: 'Only submitted progress logs can receive a supervisor response' });
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(422).json({ success: false, error: 'A useful supervisor response is required' });
    if (message.length > 3000) return res.status(422).json({ success: false, error: 'The response must be 3000 characters or fewer' });

    log.supervisorResponse = { message, respondedBy: req.user.id, respondedAt: new Date() };
    await log.save();
    await Promise.all([
      notify({ user: log.author, title: 'Progress update response', message: `${req.user.name} responded to your weekly progress update.`, type: 'info', link: '/progress-logs' }),
      recordAudit({ actor: req.user.id, action: 'progress_log.responded', entityType: 'progressLog', entityId: log._id, metadata: { project: project._id } })
    ]);
    await log.populate('author', 'name email');
    await log.populate('supervisorResponse.respondedBy', 'name role');
    res.json({ success: true, data: log });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};
