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

// @desc    Suggest project ideas
// @route   POST /api/ai/suggest-ideas
// @access  Private
exports.suggestIdeas = async (req, res) => {
  try {
    const { interests, department } = req.body;
    if (!interests || !department) {
      return res.status(400).json({ success: false, error: 'Please provide interests and department' });
    }
    const suggestions = await geminiService.suggestProjectIdeas(interests, department);
    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Review project proposal
// @route   POST /api/ai/review-proposal
// @access  Private
exports.reviewProposal = async (req, res) => {
  try {
    const { proposalText } = req.body;
    if (!proposalText) {
      return res.status(400).json({ success: false, error: 'Please provide proposalText' });
    }
    const feedback = await geminiService.generateProposalFeedback(proposalText);
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Recommend next task
// @route   POST /api/ai/recommend-task
// @access  Private
exports.recommendTask = async (req, res) => {
  try {
    const { currentStatus, pastTasks } = req.body;
    if (!currentStatus || !pastTasks || !Array.isArray(pastTasks)) {
      return res.status(400).json({ success: false, error: 'Please provide currentStatus and an array of pastTasks' });
    }
    const recommendation = await geminiService.recommendNextTask(currentStatus, pastTasks);
    res.status(200).json({ success: true, data: recommendation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
