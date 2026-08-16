const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  claimProject,
  updateProject,
  deleteProject,
  getProjectReport,
  addProjectMember,
  removeProjectMember
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/explore', require('../controllers/projectController').exploreProjects);

router.route('/')
  .get(getProjects)
  .post(authorize('student', 'supervisor', 'admin'), createProject);

router.post('/:id/claim', authorize('supervisor', 'admin'), claimProject);

router.route('/:id')
  .get(getProject)
  .put(authorize('supervisor', 'admin'), updateProject)
  .delete(authorize('supervisor', 'admin'), deleteProject);

router.get('/:id/report', getProjectReport);

router.post('/:id/members', addProjectMember);
router.delete('/:id/members/:userId', removeProjectMember);

module.exports = router;
