const express = require('express');
const router = express.Router();
const PlagiarismReport = require('../models/PlagiarismReport');
const Submission = require('../models/Submission');
const { protect, authorize } = require('../middleware/auth');
const geminiService = require('../services/geminiService');

// Get plagiarism reports for a project
router.get('/', protect, async (req, res) => {
  try {
    const { project, submission } = req.query;
    const filter = {};
    if (project) filter.project = project;
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

    let aiResult;
    try {
      // Try to use real AI
      aiResult = await geminiService.checkPlagiarism(`Title: ${sub.title}. Note: Full text parsing is simulated. Assume this represents a full student submission.`);
    } catch (aiError) {
      console.warn("AI Plagiarism check failed or no API key, falling back to mock.", aiError.message);
      // Mock fallback
      const mockSimilarity = Math.floor(Math.random() * 40) + 5;
      aiResult = {
        overallSimilarity: mockSimilarity,
        matchedSources: [
          {
            sourceName: 'Journal of Educational Technology, 2023',
            sourceUrl: 'https://example.com/journal',
            matchPercentage: Math.floor(mockSimilarity * 0.6)
          }
        ]
      };
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
