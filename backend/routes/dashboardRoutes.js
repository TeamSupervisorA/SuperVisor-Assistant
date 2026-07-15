const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);

router.get('/admin', restrictTo('admin'), dashboardController.getAdminMetrics);
router.get('/supervisor', restrictTo('supervisor'), dashboardController.getSupervisorMetrics);

module.exports = router;
