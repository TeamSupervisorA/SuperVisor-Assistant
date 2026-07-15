const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/explore', require('../controllers/projectController').exploreProjects);

router.route('/')
  .get(getProjects)
  .post(authorize('supervisor', 'admin'), createProject);

router.route('/:id')
  .get(getProject)
  .put(authorize('supervisor', 'admin'), updateProject)
  .delete(authorize('supervisor', 'admin'), deleteProject);

module.exports = router;
