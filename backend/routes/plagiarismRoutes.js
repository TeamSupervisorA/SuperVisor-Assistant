const express = require('express');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const PlagiarismReport = require('../models/PlagiarismReport');
const Submission = require('../models/Submission');
const { Project, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');
const { protect, authorize } = require('../middleware/auth');
const { screenIntegrity } = require('../services/integrityService');
const { integrityFingerprint, normalizeIntegrityText } = require('../utils/integrity');
const { sendServerError } = require('../utils/errorResponse');

const router = express.Router();
const integrityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'Too many integrity screens were requested. Please wait before trying again.' }
});

const validId = (value) => mongoose.isValidObjectId(value);
const populateReport = (query) => query
  .populate({ path: 'submission', select: 'title fileUrl student submittedAt', populate: { path: 'student', select: 'name' } })
  .populate('requestedBy', 'name role');

// Reports are scoped to projects the caller can access. Failed provider
// attempts remain in the database for operations audit but are never presented
// as completed academic evidence.
router.get('/', protect, async (req, res) => {
  try {
    const { project, submission } = req.query;
    const filter = { status: 'Completed' };
    if (project) {
      if (!validId(project)) return res.status(422).json({ success: false, error: 'Invalid project identifier' });
      const projectRecord = await Project.findById(project);
      if (!projectRecord) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!canAccessProject(projectRecord, req.user)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this project\'s reports' });
      }
      filter.project = projectRecord._id;
    } else if (req.user.role !== 'admin') {
      filter.project = { $in: await projectIdsForUser(req.user) };
    }
    if (submission) {
      if (!validId(submission)) return res.status(422).json({ success: false, error: 'Invalid submission identifier' });
      filter.submission = submission;
    }

    // A student may belong to a team project, but another student's submitted
    // draft and its integrity evidence remain private to that author and the
    // assigned reviewers. Supervisors and administrators retain project scope.
    if (req.user.role === 'student') {
      const ownedSubmissionIds = await Submission.find({
        student: req.user.id,
        ...(filter.project ? { project: filter.project } : {})
      }).distinct('_id');
      if (submission && !ownedSubmissionIds.some((id) => id.toString() === submission)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this submission report' });
      }
      filter.submission = submission || { $in: ownedSubmissionIds };
    }

    const reports = await populateReport(PlagiarismReport.find(filter)).sort({ createdAt: -1 }).limit(100);
    const data = req.user.role === 'student'
      ? reports.map((report) => {
        const value = report.toObject();
        value.matchedSources = (value.matchedSources || []).map((source) => source.sourceType === 'project-corpus'
          ? { ...source, sourceName: 'Another stored project submission', sourceSubmission: undefined }
          : source);
        return value;
      })
      : reports;
    res.json({ success: true, data });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load integrity reports');
  }
});

// Only the assigned supervisor or an administrator can create a formal screen.
// A screen requires stored text; the server never fetches an arbitrary file URL,
// which avoids SSRF and prevents pretending that an unread file was checked.
router.post('/', protect, authorize('supervisor', 'admin'), integrityLimiter, async (req, res) => {
  let pendingReport;
  try {
    const { submission, project } = req.body || {};
    if (!validId(submission) || !validId(project)) {
      return res.status(422).json({ success: false, error: 'Select a valid project submission' });
    }

    const [sub, projectRecord] = await Promise.all([
      Submission.findById(submission),
      Project.findById(project)
    ]);
    if (!sub) return res.status(404).json({ success: false, error: 'Submission not found' });
    if (!projectRecord) return res.status(404).json({ success: false, error: 'Project not found' });
    if (sub.project.toString() !== projectRecord._id.toString()) {
      return res.status(422).json({ success: false, error: 'Submission does not belong to the selected project' });
    }
    if (!canAccessProject(projectRecord, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to check this project' });
    }

    const text = normalizeIntegrityText(sub.content);
    if (text.length < 200) {
      return res.status(422).json({
        success: false,
        error: 'This submission does not contain enough stored text to screen. Paste at least 200 characters into the submission; attachments are not read automatically.'
      });
    }
    const contentHash = integrityFingerprint(text);

    const existing = await populateReport(PlagiarismReport.findOne({
      submission: sub._id,
      contentHash,
      status: 'Completed',
      isCurrent: true
    }).select('+contentHash')).sort({ createdAt: -1 });
    const hasPublicWebCoverage = existing?.coverage?.some((item) => /public-web/i.test(item));
    const recentFallback = existing?.providerNotice && (Date.now() - new Date(existing.createdAt).getTime()) < (10 * 60 * 1000);
    if (existing && (hasPublicWebCoverage || recentFallback)) {
      const data = existing.toObject();
      delete data.contentHash;
      return res.status(200).json({ success: true, reused: true, data });
    }

    const alreadyRunning = await PlagiarismReport.exists({ submission: sub._id, status: 'Pending' });
    if (alreadyRunning) {
      return res.status(409).json({ success: false, error: 'An integrity screen is already running for this submission.' });
    }

    pendingReport = await PlagiarismReport.create({
      submission: sub._id,
      project: projectRecord._id,
      requestedBy: req.user.id,
      contentHash,
      checkedCharacterCount: text.length,
      status: 'Pending',
      isCurrent: false
    });

    let result;
    try {
      const comparisonSubmissions = await Submission.find({
        project: projectRecord._id,
        _id: { $ne: sub._id },
        content: { $exists: true, $ne: '' }
      }).sort({ submittedAt: -1 }).limit(100).select('_id title content').lean();
      result = await screenIntegrity({ text, comparisonSubmissions });
    } catch (providerError) {
      const isInputError = /required|at least|too long/i.test(providerError.message);
      const isQuotaError = /RESOURCE_EXHAUSTED|quota|\b429\b/i.test(providerError.message);
      await PlagiarismReport.findByIdAndUpdate(pendingReport._id, {
        status: 'Failed',
        summary: isQuotaError ? 'The screening provider quota was unavailable.' : 'The screening provider did not return a usable report.',
        completedAt: new Date()
      });
      return res.status(isInputError ? 422 : isQuotaError ? 429 : 503).json({
        success: false,
        error: isInputError
          ? providerError.message
          : isQuotaError
            ? 'The AI service quota has been reached. Please try again later or ask an administrator to review Gemini billing and rate limits.'
            : 'Similarity checking is temporarily unavailable. No completed report was created.'
      });
    }

    await PlagiarismReport.updateMany(
      { submission: sub._id, status: 'Completed', _id: { $ne: pendingReport._id } },
      { $set: { isCurrent: false } }
    );
    const completed = await populateReport(PlagiarismReport.findByIdAndUpdate(pendingReport._id, {
      overallSimilarity: result.overallSimilarity,
      summary: result.summary,
      method: result.method,
      providerModel: result.model,
      disclaimer: result.disclaimer,
      sourcesSearched: result.sourcesSearched || [],
      searchQueryCount: result.searchQueryCount || 0,
      searchSuggestionsHtml: result.searchSuggestionsHtml || '',
      coverage: result.coverage || [],
      providerNotice: result.providerNotice || '',
      checkedCharacterCount: result.checkedCharacterCount || text.length,
      matchedSources: result.matchedSources || [],
      status: 'Completed',
      completedAt: new Date(),
      isCurrent: true
    }, { returnDocument: 'after', runValidators: true }));

    res.status(201).json({ success: true, reused: false, data: completed });
  } catch (error) {
    if (pendingReport?._id) {
      await PlagiarismReport.findByIdAndUpdate(pendingReport._id, {
        status: 'Failed',
        summary: 'The integrity screen failed before completion.',
        completedAt: new Date()
      }).catch(() => {});
    }
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, error: 'An integrity screen is already running for this submission.' });
    }
    return sendServerError(res, error, 'Unable to complete the integrity screen');
  }
});

module.exports = router;
