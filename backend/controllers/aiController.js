const geminiService = require('../services/geminiService');

// @desc    Generate feedback for a submission
// @route   POST /api/ai/feedback
// @access  Private
exports.generateFeedback = async (req, res) => {
  try {
    const { text, criteria } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Please provide submission text' });
    }

    const feedback = await geminiService.generateFeedback(text, criteria || 'General academic quality and clarity');

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Check plagiarism
// @route   POST /api/ai/plagiarism
// @access  Private (Teacher/Admin only)
exports.checkPlagiarism = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Please provide text to check' });
    }

    const result = await geminiService.checkPlagiarism(text);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
