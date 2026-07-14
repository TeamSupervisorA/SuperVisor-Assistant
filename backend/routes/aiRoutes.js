const express = require('express');
const { generateFeedback, checkPlagiarism, suggestIdeas, reviewProposal, recommendTask } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/feedback', protect, generateFeedback);
router.post('/plagiarism', protect, authorize('supervisor', 'admin'), checkPlagiarism);
router.post('/suggest-ideas', protect, suggestIdeas);
router.post('/review-proposal', protect, reviewProposal);
router.post('/recommend-task', protect, recommendTask);

module.exports = router;
