const express = require('express');
const { protect } = require('../middleware/auth');
const controller = require('../controllers/progressController');

const router = express.Router();
router.get('/projects/:projectId/progress-logs', protect, controller.getProgressLogs);
router.post('/projects/:projectId/progress-logs', protect, controller.createProgressLog);
router.put('/progress-logs/:id', protect, controller.updateProgressLog);
router.post('/progress-logs/:id/submit', protect, controller.submitProgressLog);
router.post('/progress-logs/:id/respond', protect, controller.respondToProgressLog);
module.exports = router;
