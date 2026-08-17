const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const courseController = require('../controllers/courseController');

const router = express.Router();

// All course routes require authentication and admin role
router.use(protect);

router
  .route('/')
  .get(courseController.getAllCourses)
  .post(authorize('admin'), courseController.createCourse);

router
  .route('/:id')
  .put(authorize('admin'), courseController.updateCourse)
  .delete(authorize('admin'), courseController.deleteCourse);

module.exports = router;
