const express = require('express');
const { protect } = require('../middleware/auth');
const controller = require('../controllers/progressController');

const router = express.Router();
router.use(protect);
router.get('/projects/:projectId/progress-logs', controller.getProgressLogs);
router.post('/projects/:projectId/progress-logs', controller.createProgressLog);
router.put('/progress-logs/:id', controller.updateProgressLog);
router.post('/progress-logs/:id/submit', controller.submitProgressLog);
module.exports = router;
