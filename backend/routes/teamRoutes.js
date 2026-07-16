const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const teamController = require('../controllers/teamController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(teamController.getAllTeams)
  .post(authorize('supervisor', 'admin'), teamController.createTeam);

router
  .route('/:id')
  .get(teamController.getTeam)
  .put(authorize('supervisor', 'admin'), teamController.updateTeam)
  .delete(authorize('supervisor', 'admin'), teamController.deleteTeam);

module.exports = router;
