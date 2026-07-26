const Report = require('../models/Report');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const ProgressLog = require('../models/ProgressLog');
const Review = require('../models/Review');
const { Project, canAccessProject } = require('../utils/projectAccess');
const { recordAudit } = require('../services/auditService');

const makeSnapshot = async (project) => {
  const [tasks, submissions, logs, reviews] = await Promise.all([
    Task.find({ project: project._id }).lean(),
    Submission.find({ project: project._id }).lean(),
    ProgressLog.find({ project: project._id }).lean(),
    Review.find({ project: project._id }).lean()
  ]);
  const completed = tasks.filter((task) => ['done', 'completed'].includes(task.status)).length;
  const overdue = tasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date() && !['done', 'completed', 'cancelled'].includes(task.status)).length;
  return {
    generatedAt: new Date(), project: { title: project.title, status: project.status, proposalState: project.proposalState },
    tasks: { total: tasks.length, completed, overdue, progressPercentage: tasks.length ? Math.round((completed / tasks.length) * 100) : 0 },
    submissions: { total: submissions.length, graded: submissions.filter((item) => item.status === 'Graded').length },
    progressLogs: { total: logs.length, submitted: logs.filter((log) => log.state === 'submitted').length },
    reviews: { total: reviews.length, submitted: reviews.filter((review) => review.state === 'submitted').length }
  };
};

exports.createReport = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to generate a report for this project' });
    const type = req.body.type === 'final' ? 'final' : 'progress';
    const latest = await Report.findOne({ project: project._id, type }).sort({ version: -1 }).select('version');
    const report = await Report.create({ project: project._id, type, version: (latest?.version || 0) + 1, status: 'generating', requestedBy: req.user.id });
    report.snapshot = await makeSnapshot(project);
    report.status = 'ready';
    report.readyAt = new Date();
    await report.save();
    await recordAudit({ actor: req.user.id, action: 'report.generated', entityType: 'report', entityId: report._id, metadata: { project: project._id, type, version: report.version } });
    res.status(201).json({ success: true, data: report });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.getReports = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to view reports for this project' });
    const reports = await Report.find({ project: project._id }).populate('requestedBy', 'name email').sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};
