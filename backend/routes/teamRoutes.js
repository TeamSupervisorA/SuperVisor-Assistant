const express = require('express');
const { protect } = require('../middleware/auth');
const teamController = require('../controllers/teamController');

const router = express.Router();

router.use(protect);

// Ownership rules live in the controller: students create teams for their own
// projects and become Leader; only leader/supervisor/admin may modify (proposal §4.2)
router
  .route('/')
  .get(teamController.getAllTeams)
  .post(teamController.createTeam);

router
  .route('/:id')
  .get(teamController.getTeam)
  .put(teamController.updateTeam)
  .delete(teamController.deleteTeam);

module.exports = router;
