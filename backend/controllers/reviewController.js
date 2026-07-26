const Review = require('../models/Review');
const ProposalVersion = require('../models/ProposalVersion');
const { Project, canAccessProject } = require('../utils/projectAccess');
const { recordAudit } = require('../services/auditService');

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
    if (req.user.role !== 'admin' && project.supervisor?.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Only the assigned supervisor may create a review' });
    const review = await Review.create({ ...req.body, project: project._id, proposalVersion: proposal._id, reviewer: req.user.id });
    await recordAudit({ actor: req.user.id, action: 'review.created', entityType: 'review', entityId: review._id, metadata: { project: project._id, proposalVersion: proposal._id } });
    res.status(201).json({ success: true, data: review });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.submitReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, error: 'Review not found' });
    if (review.reviewer.toString() !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ success: false, error: 'Not authorized to submit this review' });
    if (review.state !== 'draft') return res.status(409).json({ success: false, error: 'Only draft reviews can be submitted' });
    review.state = 'submitted';
    await review.save();
    await recordAudit({ actor: req.user.id, action: 'review.submitted', entityType: 'review', entityId: review._id, metadata: { project: review.project, proposalVersion: review.proposalVersion } });
    res.json({ success: true, data: review });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};
