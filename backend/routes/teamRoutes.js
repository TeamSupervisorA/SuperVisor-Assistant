const express = require('express');
const { protect } = require('../middleware/auth');
const teamController = require('../controllers/teamController');

const router = express.Router();

router.use(protect);

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
