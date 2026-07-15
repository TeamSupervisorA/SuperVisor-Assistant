const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const courseController = require('../controllers/courseController');

const router = express.Router();

// All course routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(courseController.getAllCourses)
  .post(courseController.createCourse);

router
  .route('/:id')
  .put(courseController.updateCourse)
  .delete(courseController.deleteCourse);

module.exports = router;
