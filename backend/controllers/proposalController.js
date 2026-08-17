const ProposalVersion = require('../models/ProposalVersion');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { canAccessProject } = require('../utils/projectAccess');
const { recordAudit } = require('../services/auditService');

const getProject = async (id) => Project.findById(id);

exports.getProposalVersions = async (req, res) => {
  try {
    const project = await getProject(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to view proposals for this project' });
    const versions = await ProposalVersion.find({ project: project._id })
      .populate('createdBy submittedBy decision.decidedBy', 'name email')
      .sort({ versionNo: -1 });
    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.createProposalDraft = async (req, res) => {
  try {
    const project = await getProject(req.params.projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to create a proposal for this project' });
    // Proposal versions are student-authored records. Supervisors and
    // administrators review or decide them; they must not impersonate an
    // author through this endpoint.
    if (req.user.role !== 'student' || !project.students.some((student) => student.toString() === req.user.id)) {
      return res.status(403).json({ success: false, error: 'Only project students may author proposal drafts' });
    }

    const latest = await ProposalVersion.findOne({ project: project._id }).sort({ versionNo: -1 }).select('versionNo');
    const version = await ProposalVersion.create({
      project: project._id,
      versionNo: (latest?.versionNo || 0) + 1,
      title: req.body.title || project.title,
      content: req.body.content || project.description || '',
      attachments: req.body.attachments || [],
      createdBy: req.user.id
    });
    await recordAudit({ actor: req.user.id, action: 'proposal.draft_created', entityType: 'proposalVersion', entityId: version._id, metadata: { project: project._id, versionNo: version.versionNo } });
    res.status(201).json({ success: true, data: version });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateProposalDraft = async (req, res) => {
  try {
    const version = await ProposalVersion.findById(req.params.versionId);
    if (!version) return res.status(404).json({ success: false, error: 'Proposal version not found' });
    const project = await getProject(version.project);
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to update this proposal' });
    if (version.state !== 'draft' || version.createdBy.toString() !== req.user.id) return res.status(409).json({ success: false, error: 'Only the author can edit an unsubmitted proposal draft' });

    for (const field of ['title', 'content', 'attachments']) {
      if (Object.hasOwn(req.body, field)) version[field] = req.body[field];
    }
    await version.save();
    res.json({ success: true, data: version });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.submitProposal = async (req, res) => {
  try {
    const version = await ProposalVersion.findById(req.params.versionId);
    if (!version) return res.status(404).json({ success: false, error: 'Proposal version not found' });
    const project = await getProject(version.project);
    if (!canAccessProject(project, req.user) || version.createdBy.toString() !== req.user.id) return res.status(403).json({ success: false, error: 'Not authorized to submit this proposal' });
    if (version.state !== 'draft') return res.status(409).json({ success: false, error: 'Only draft proposal versions can be submitted' });

    version.state = version.versionNo === 1 ? 'submitted' : 'resubmitted';
    version.submittedBy = req.user.id;
    version.submittedAt = new Date();
    await version.save();
    project.proposalState = version.state;
    await project.save();
    if (project.supervisor) await Notification.create({ user: project.supervisor, title: 'Proposal awaiting review', message: `Proposal version ${version.versionNo} for "${project.title}" was submitted.`, type: 'info', link: '/proposals' });
    await recordAudit({ actor: req.user.id, action: 'proposal.submitted', entityType: 'proposalVersion', entityId: version._id, metadata: { project: project._id, versionNo: version.versionNo } });
    res.json({ success: true, data: version });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.decideProposal = async (req, res) => {
  try {
    const { decision, comment = '' } = req.body;
    if (!['approved', 'rejected', 'revision_requested'].includes(decision)) return res.status(422).json({ success: false, error: 'Invalid proposal decision' });
    const version = await ProposalVersion.findById(req.params.versionId);
    if (!version) return res.status(404).json({ success: false, error: 'Proposal version not found' });
    const project = await getProject(version.project);
    if (!canAccessProject(project, req.user) || (req.user.role !== 'admin' && project.supervisor?.toString() !== req.user.id)) return res.status(403).json({ success: false, error: 'Only the assigned supervisor may decide this proposal' });
    if (!['submitted', 'resubmitted', 'under_review'].includes(version.state)) return res.status(409).json({ success: false, error: 'This proposal is not awaiting a decision' });

    version.state = decision;
    version.decision = { value: decision, comment, decidedBy: req.user.id, decidedAt: new Date() };
    await version.save();
    project.proposalState = decision;
    if (decision === 'approved') {
      project.approvedProposalVersion = version._id;
      project.status = 'active';
    }
    await project.save();
    for (const student of project.students) await Notification.create({ user: student, title: `Proposal ${decision.replace('_', ' ')}`, message: `Proposal version ${version.versionNo} for "${project.title}" was ${decision.replace('_', ' ')}.`, type: decision === 'approved' ? 'success' : 'warning', link: '/proposals' });
    await recordAudit({ actor: req.user.id, action: `proposal.${decision}`, entityType: 'proposalVersion', entityId: version._id, metadata: { project: project._id, versionNo: version.versionNo } });
    res.json({ success: true, data: version });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
