const geminiService = require('../services/geminiService');
const AIInteraction = require('../models/AIInteraction');

const recordInteraction = async (req, feature, input, result) => {
  try {
    await AIInteraction.create({
      feature,
      actor: req.user.id,
      project: req.body.project || undefined,
      model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      input,
      ...result
    });
  } catch (error) {
    console.error('AI interaction write failed:', error.message);
  }
};

exports.getInteractions = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { actor: req.user.id };
    if (req.query.project) query.project = req.query.project;
    const interactions = await AIInteraction.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: interactions });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.rateInteraction = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(422).json({ success: false, error: 'Rating must be an integer from 1 to 5' });
    const interaction = await AIInteraction.findOneAndUpdate({ _id: req.params.id, actor: req.user.id }, { rating }, { returnDocument: 'after' });
    if (!interaction) return res.status(404).json({ success: false, error: 'AI interaction not found' });
    res.json({ success: true, data: interaction });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

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

    await recordInteraction(req, 'feedback', { criteria: criteria || 'General academic quality and clarity', textLength: text.length }, { output: feedback, status: 'succeeded' });

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    await recordInteraction(req, 'feedback', { textLength: req.body?.text?.length || 0 }, { status: 'failed', error: error.message });
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

    await recordInteraction(req, 'plagiarism', { textLength: text.length }, { output: result, status: 'succeeded' });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    await recordInteraction(req, 'plagiarism', { textLength: req.body?.text?.length || 0 }, { status: 'failed', error: error.message });
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
    await recordInteraction(req, 'project_ideas', { interests, department }, { output: suggestions, status: 'succeeded' });
    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    await recordInteraction(req, 'project_ideas', { interests: req.body?.interests, department: req.body?.department }, { status: 'failed', error: error.message });
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
    await recordInteraction(req, 'proposal_feedback', { proposalText }, { output: feedback, status: 'succeeded' });
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    await recordInteraction(req, 'proposal_feedback', { proposalText: req.body?.proposalText }, { status: 'failed', error: error.message });
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
    await recordInteraction(req, 'next_task', { currentStatus, pastTasks }, { output: recommendation, status: 'succeeded' });
    res.status(200).json({ success: true, data: recommendation });
  } catch (error) {
    await recordInteraction(req, 'next_task', { currentStatus: req.body?.currentStatus, pastTasks: req.body?.pastTasks }, { status: 'failed', error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
};
