const express = require('express');
const router = express.Router();
const PlagiarismReport = require('../models/PlagiarismReport');
const { protect } = require('../middleware/authMiddleware');

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
router.post('/', protect, async (req, res) => {
  try {
    const { submission, project } = req.body;

    // Mock plagiarism generation logic
    const mockSimilarity = Math.floor(Math.random() * 40) + 5; // random 5-45%
    const report = await PlagiarismReport.create({
      submission,
      project,
      overallSimilarity: mockSimilarity,
      status: 'Completed',
      matchedSources: [
        {
          sourceName: 'Journal of Educational Technology, 2023',
          sourceUrl: 'https://example.com/journal',
          matchPercentage: Math.floor(mockSimilarity * 0.6)
        },
        {
          sourceName: 'arxiv.org/abs/2204.12345',
          sourceUrl: 'https://arxiv.org/abs/2204.12345',
          matchPercentage: Math.floor(mockSimilarity * 0.3)
        }
      ]
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
