const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);

router.get('/admin', authorize('admin'), dashboardController.getAdminMetrics);
router.get('/supervisor', authorize('supervisor'), dashboardController.getSupervisorMetrics);
router.get('/student', authorize('student'), dashboardController.getStudentMetrics);

module.exports = router;
