const express = require('express');
const rateLimit = require('express-rate-limit');
const { academicAssistant, generateFeedback, checkPlagiarism, suggestIdeas, reviewProposal, generateProposalOutline, generateProjectReportDraft, recommendTask, getInteractions, rateInteraction, getStatus } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'Too many AI requests. Please wait before trying again.' }
});

router.use(protect, aiLimiter);

router.get('/status', getStatus);
router.get('/interactions', getInteractions);
router.put('/interactions/:id/rating', rateInteraction);

router.post('/feedback', generateFeedback);
router.post('/assistant', academicAssistant);
router.post('/plagiarism', authorize('supervisor', 'admin'), checkPlagiarism);
router.post('/suggest-ideas', suggestIdeas);
router.post('/review-proposal', reviewProposal);
router.post('/proposal-outline', generateProposalOutline);
router.post('/projects/:projectId/report-draft', generateProjectReportDraft);
router.post('/recommend-task', recommendTask);

module.exports = router;
