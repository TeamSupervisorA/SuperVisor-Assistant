const Review = require('../models/Review');
const ProposalVersion = require('../models/ProposalVersion');
const { Project, canAccessProject } = require('../utils/projectAccess');
const { recordAudit } = require('../services/auditService');
const Notification = require('../models/Notification');

const notify = async (fields) => {
  try { await Notification.create(fields); } catch { /* non-critical notification */ }
};

exports.getReviews = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to view reviews' });
    const reviews = await Review.find({ project: project._id }).populate('reviewer proposalVersion', 'name email versionNo title state').sort({ createdAt: -1 });
    res.json({ success: true, data: reviews });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.createReview = async (req, res) => {
  try {
    const proposal = await ProposalVersion.findById(req.body.proposalVersion);
    if (!proposal) return res.status(404).json({ success: false, error: 'Proposal version not found' });
    const project = await Project.findById(proposal.project);
    if (!canAccessProject(project, req.user) || (req.user.role !== 'admin' && project.supervisor?.toString() !== req.user.id)) return res.status(403).json({ success: false, error: 'Only the assigned supervisor may create a review' });
    if (!['submitted', 'resubmitted', 'under_review'].includes(proposal.state)) {
      return res.status(409).json({ success: false, error: 'Only a submitted proposal version can be reviewed' });
    }
    if (req.body.findings !== undefined && !Array.isArray(req.body.findings)) {
      return res.status(422).json({ success: false, error: 'findings must be an array' });
    }
    const review = await Review.create({
      project: project._id,
      proposalVersion: proposal._id,
      reviewer: req.user.id,
      rubric: req.body.rubric && typeof req.body.rubric === 'object' ? req.body.rubric : {},
      findings: Array.isArray(req.body.findings) ? req.body.findings : [],
      overallComment: typeof req.body.overallComment === 'string' ? req.body.overallComment : '',
      state: 'draft'
    });
    if (proposal.state !== 'under_review') {
      proposal.state = 'under_review';
      await proposal.save();
      project.proposalState = 'under_review';
      await project.save();
    }
    await recordAudit({ actor: req.user.id, action: 'review.created', entityType: 'review', entityId: review._id, metadata: { project: project._id, proposalVersion: proposal._id } });
    res.status(201).json({ success: true, data: review });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.submitReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
    const project = await Project.findById(review.project);
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to submit this review' });
    if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Not authorized to submit this review' });
    if (review.state !== 'draft') return res.status(409).json({ success: false, error: 'Only draft reviews can be submitted' });
    review.state = 'submitted';
    await review.save();
    const projectRecord = await Project.findById(review.project).select('title students');
    if (projectRecord) {
      await Promise.all(projectRecord.students.map((student) => notify({
        user: student,
        title: 'Supervisor review is ready',
        message: `A supervisor review for "${projectRecord.title}" is ready for you to read.`,
        type: 'info',
        link: '/reviews'
      })));
    }
    await recordAudit({ actor: req.user.id, action: 'review.submitted', entityType: 'review', entityId: review._id, metadata: { project: review.project, proposalVersion: review.proposalVersion } });
    res.json({ success: true, data: review });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};
