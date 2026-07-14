const express = require('express');
const { generateFeedback, checkPlagiarism } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/feedback', protect, generateFeedback);
router.post('/plagiarism', protect, authorize('supervisor', 'admin'), checkPlagiarism);

module.exports = router;
