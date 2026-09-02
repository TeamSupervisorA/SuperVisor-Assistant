const Submission = require('../models/Submission');
const Task = require('../models/Task');
const { Project, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');
const Notification = require('../models/Notification');
const User = require('../models/User');
const PlagiarismReport = require('../models/PlagiarismReport');
const { screenIntegrity } = require('../services/integrityService');
const { integrityFingerprint, normalizeIntegrityText } = require('../utils/integrity');
const { sendServerError } = require('../utils/errorResponse');

// Notifications are best-effort — never fail the main operation over one
const notify = async (fields) => {
  try {
    await Notification.create(fields);
  } catch (e) { /* non-fatal */ }
};
const normalizeSubmissionUrl = (value) => {
  const url = typeof value === 'string' ? value.trim() : '';
  if (!url || url.startsWith('/api/upload/file/')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') return parsed.toString();
  } catch { /* handled below */ }
  const error = new Error('Deliverable links must use HTTPS or an uploaded project file');
  error.statusCode = 422;
  throw error;
};

// Automatic checks are opt-in per supervisor and only run when the student has
// supplied enough text. A provider error never rejects the academic submission.
const runAutomaticIntegrityScreen = async (submission, project) => {
  const text = normalizeIntegrityText(submission.content);
  if (!project.supervisor || text.length < 200) return;
  const supervisor = await User.findById(project.supervisor).select('settings.plagiarismAutoCheck settings.plagiarismTolerance');
  if (!supervisor?.settings?.plagiarismAutoCheck) return;
  const contentHash = integrityFingerprint(text);
  let pendingReport;
  try {
    const currentReport = await PlagiarismReport.exists({ submission: submission._id, contentHash, status: 'Completed', isCurrent: true });
    if (currentReport) return;
    pendingReport = await PlagiarismReport.create({
      submission: submission._id,
      project: project._id,
      requestedBy: project.supervisor,
      contentHash,
      checkedCharacterCount: text.length,
      status: 'Pending',
      isCurrent: false
    });
    const comparisonSubmissions = await Submission.find({
      project: project._id,
      _id: { $ne: submission._id },
      content: { $exists: true, $ne: '' }
    }).sort({ submittedAt: -1 }).limit(100).select('_id title content').lean();
    const result = await screenIntegrity({ text, comparisonSubmissions });
    await PlagiarismReport.updateMany(
      { submission: submission._id, status: 'Completed', _id: { $ne: pendingReport._id } },
      { $set: { isCurrent: false } }
    );
    await PlagiarismReport.findByIdAndUpdate(pendingReport._id, {
      overallSimilarity: result.overallSimilarity,
      summary: result.summary,
      method: result.method,
      providerModel: result.model,
      disclaimer: result.disclaimer,
      sourcesSearched: result.sourcesSearched,
      searchQueryCount: result.searchQueryCount || 0,
      searchSuggestionsHtml: result.searchSuggestionsHtml || '',
      coverage: result.coverage || [],
      providerNotice: result.providerNotice || '',
      matchedSources: result.matchedSources,
      status: 'Completed',
      completedAt: new Date(),
      isCurrent: true
    });
    const threshold = Number.isFinite(supervisor.settings?.plagiarismTolerance) ? supervisor.settings.plagiarismTolerance : 20;
    const needsReview = result.overallSimilarity > threshold;
    await notify({
      user: project.supervisor,
      title: needsReview ? 'Integrity screen needs review' : 'Automatic integrity screen ready',
      message: `An integrity screen is ready for "${submission.title}" (${result.overallSimilarity}% screening indicator; your review threshold: ${threshold}%). Review the source evidence before taking action.`,
      type: needsReview ? 'warning' : 'info',
      link: '/plagiarism-checker'
    });
  } catch (error) {
    if (pendingReport?._id) {
      await PlagiarismReport.findByIdAndUpdate(pendingReport._id, {
        status: 'Failed',
        summary: 'The automatic screening provider did not return a usable report.',
        completedAt: new Date()
      }).catch(() => {});
    }
    console.warn('Automatic integrity screen unavailable:', error.message);
  }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) {
      const project = await Project.findById(req.query.project);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!canAccessProject(project, req.user)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this project\'s submissions' });
      }
      filter.project = req.query.project;
    }
    // Students only see their own submissions
    if (req.user.role === 'student') filter.student = req.user.id;
    else if (['supervisor', 'admin'].includes(req.user.role)) filter.project = filter.project || { $in: await projectIdsForUser(req.user) };

    const submissions = await Submission.find(filter)
      .populate('student', 'name email')
      .populate('project', 'title')
      .populate('task', 'title status assignedTo')
      .sort({ submittedAt: -1 });
    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load submissions');
  }
};

exports.createSubmission = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, error: 'Only students can create submissions' });
    }
    const project = await Project.findById(req.body.project);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to submit to this project' });
    }
    if (project.status !== 'active') {
      return res.status(409).json({ success: false, error: 'Deliverables open after the supervisor accepts and the proposal activates the project' });
    }

    const { title, task, fileUrl } = req.body;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    const normalizedFileUrl = normalizeSubmissionUrl(fileUrl);
    if (!normalizedFileUrl && !content) {
      return res.status(422).json({ success: false, error: 'Provide a file or paste the submission text' });
    }
    if (!task) return res.status(422).json({ success: false, error: 'Choose the project task this deliverable satisfies' });
    const projectTask = await Task.findOne({ _id: task, project: project._id });
    if (!projectTask) return res.status(422).json({ success: false, error: 'The selected task does not belong to this project' });
    if (projectTask.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'You can submit only work assigned to you' });
    }
    if (!['in_progress', 'revision'].includes(projectTask.status)) {
      return res.status(409).json({ success: false, error: 'Start the linked task before submitting its deliverable' });
    }
    // Submission metadata is owned by the server: a student must never be able
    // to pre-grade a submission, submit as another user, or change its project.
    const submission = await Submission.create({
      title,
      task,
      milestone: projectTask.milestone || null,
      fileUrl: normalizedFileUrl,
      content,
      project: project._id,
      student: req.user.id
    });

    // Creating evidence saves a student-owned draft. The supervisor is
    // notified only when the task itself enters the review queue.
    await runAutomaticIntegrityScreen(submission, project);

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.updateSubmission = async (req, res) => {
  try {
    let submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });

    const project = await Project.findById(submission.project);
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this submission' });
    }

    let updates;
    if (req.user.role === 'student') {
      // Students may only edit their own submission, and never grading fields
      if (submission.student.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to update this submission' });
      }
      if (['Under Review', 'Graded'].includes(submission.status)) {
        return res.status(409).json({ success: false, error: 'This submission is already under review or graded and can no longer be edited' });
      }
      const studentFields = ['title', 'task', 'fileUrl', 'content'];
      updates = Object.fromEntries(Object.entries(req.body).filter(([field]) => studentFields.includes(field)));
    } else {
      if (submission.task && (req.body.grade !== undefined || req.body.feedback !== undefined || req.body.status !== undefined)) {
        return res.status(409).json({ success: false, error: 'Task-linked deliverables must be decided from the task review workflow so task and submission state stay synchronized' });
      }
      const reviewerFields = ['grade', 'feedback', 'status'];
      updates = Object.fromEntries(Object.entries(req.body).filter(([field]) => reviewerFields.includes(field)));
    }
    if (Object.keys(updates).length === 0) {
      return res.status(422).json({ success: false, error: 'No supported submission fields were provided' });
    }
    if (updates.task) {
      const projectTask = await Task.findOne({ _id: updates.task, project: submission.project });
      if (!projectTask) return res.status(422).json({ success: false, error: 'The selected task does not belong to this project' });
      if (req.user.role === 'student' && projectTask.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'You can submit only work assigned to you' });
      }
    }
    if (req.user.role === 'student') {
      if (updates.content !== undefined) updates.content = typeof updates.content === 'string' ? updates.content.trim() : '';
      if (updates.fileUrl !== undefined) updates.fileUrl = normalizeSubmissionUrl(updates.fileUrl);
      const nextContent = updates.content !== undefined ? updates.content : submission.content;
      const nextFileUrl = updates.fileUrl !== undefined ? updates.fileUrl : submission.fileUrl;
      if (!nextContent?.trim() && !nextFileUrl?.trim()) {
        return res.status(422).json({ success: false, error: 'Provide a file or paste the submission text' });
      }
      // Editing returned work prepares a new draft. Only the task review
      // endpoint can place it in the supervisor's queue.
      if (submission.status === 'Needs Revision') updates.status = 'Draft';
    }

    const wasGraded = req.user.role !== 'student' && (
      updates.grade || updates.feedback || ['Graded', 'Needs Revision'].includes(updates.status)
    );
    const invalidatesIntegrityReport = req.user.role === 'student' && (updates.content !== undefined || updates.fileUrl !== undefined);
    submission = await Submission.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after', runValidators: true });
    if (invalidatesIntegrityReport) {
      await PlagiarismReport.updateMany({ submission: submission._id }, { $set: { isCurrent: false } });
    }

    if (wasGraded) {
      await notify({
        user: submission.student,
        title: updates.status === 'Needs Revision' ? 'Revision requested' : 'Feedback received',
        message: `Your submission "${submission.title}" has been reviewed${updates.grade ? ` — grade: ${updates.grade}` : ''}.`,
        type: updates.status === 'Needs Revision' ? 'warning' : 'success',
        link: '/student-submissions'
      });
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });

    const project = await Project.findById(submission.project);
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this submission' });
    }

    if (req.user.role === 'student' && submission.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this submission' });
    }
    if (['Under Review', 'Graded'].includes(submission.status)) {
      return res.status(409).json({ success: false, error: 'A deliverable under review or already graded is an academic record and cannot be deleted' });
    }

    await Promise.all([
      submission.deleteOne(),
      PlagiarismReport.deleteMany({ submission: submission._id })
    ]);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
