const express = require('express');
const { protect } = require('../middleware/auth');
const controller = require('../controllers/reportController');
const router = express.Router();
router.get('/projects/:projectId/reports', protect, controller.getReports);
router.post('/projects/:projectId/reports', protect, controller.createReport);
module.exports = router;
