const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const controller = require('../controllers/reviewController');

const router = express.Router();
router.get('/projects/:projectId/reviews', protect, controller.getReviews);
router.post('/reviews', protect, authorize('supervisor', 'admin'), controller.createReview);
router.post('/reviews/:id/submit', protect, authorize('supervisor', 'admin'), controller.submitReview);
module.exports = router;
