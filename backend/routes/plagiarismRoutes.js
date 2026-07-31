const express = require('express');
const router = express.Router();
const PlagiarismReport = require('../models/PlagiarismReport');
const Submission = require('../models/Submission');
const { Project, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');
const { protect, authorize } = require('../middleware/auth');
const geminiService = require('../services/geminiService');

// Get plagiarism reports for a project
router.get('/', protect, async (req, res) => {
  try {
    const { project, submission } = req.query;
    const filter = {};
    if (project) {
      const projectRecord = await Project.findById(project);
      if (!projectRecord) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!canAccessProject(projectRecord, req.user)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this project\'s reports' });
      }
      filter.project = project;
    } else if (req.user.role !== 'admin') {
      filter.project = { $in: await projectIdsForUser(req.user) };
    }
    if (submission) filter.submission = submission;

    const reports = await PlagiarismReport.find(filter)
      .populate('submission', 'title fileUrl')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create/Run a new plagiarism report
router.post('/', protect, authorize('supervisor', 'admin'), async (req, res) => {
  try {
    const { submission, project } = req.body;

    // Get the submission text (using title as proxy since fileUrl might just be a link)
    const sub = await Submission.findById(submission);
    if (!sub) return res.status(404).json({ success: false, error: 'Submission not found' });
    if (sub.project.toString() !== project) {
      return res.status(400).json({ success: false, error: 'Submission does not belong to the supplied project' });
    }
    const projectRecord = await Project.findById(project);
    if (!canAccessProject(projectRecord, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to check this project' });
    }

    // Do not invent a similarity score or sources. A failed provider check must
    // be visible to the user so it cannot be mistaken for an academic result.
    let aiResult;
    try {
      aiResult = await geminiService.checkPlagiarism(`Title: ${sub.title}. Note: Full text parsing is simulated. Assume this represents a full student submission.`);
    } catch (aiError) {
      console.error('Plagiarism check failed:', aiError.message);
      return res.status(503).json({ success: false, error: 'Similarity checking is temporarily unavailable. No report was created.' });
    }

    const report = await PlagiarismReport.create({
      submission,
      project,
      overallSimilarity: aiResult.overallSimilarity || 0,
      status: 'Completed',
      matchedSources: aiResult.matchedSources || []
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
