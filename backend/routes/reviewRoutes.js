const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const controller = require('../controllers/reviewController');

const router = express.Router();
router.use(protect);
router.get('/projects/:projectId/reviews', controller.getReviews);
router.post('/reviews', authorize('supervisor', 'admin'), controller.createReview);
router.post('/reviews/:id/submit', authorize('supervisor', 'admin'), controller.submitReview);
module.exports = router;
