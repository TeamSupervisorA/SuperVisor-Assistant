const express = require('express');
const { protect } = require('../middleware/auth');
const controller = require('../controllers/reportController');
const router = express.Router();
router.use(protect);
router.get('/projects/:projectId/reports', controller.getReports);
router.post('/projects/:projectId/reports', controller.createReport);
module.exports = router;
