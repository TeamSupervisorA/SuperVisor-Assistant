const express = require('express');
const { protect } = require('../middleware/auth');
const teamController = require('../controllers/teamController');

const router = express.Router();
const retiredMutation = (_req, res) => res.status(410).json({
  success: false,
  error: 'Separate team workflows are retired. Use the project People & Supervision endpoints.'
});

router.use(protect);

router.get('/directory/supervisors', teamController.getSupervisorDirectory);
router.get('/invitations/mine', (_req, res) => res.json({ success: true, data: [] }));

// Ownership rules live in the controller: students create teams for their own
// projects and become Leader; only leader/supervisor/admin may modify (proposal §4.2)
router
  .route('/')
  .get(teamController.getAllTeams)
  .post(retiredMutation);

router
  .route('/:id')
  .get(teamController.getTeam)
  .put(retiredMutation)
  .delete(retiredMutation);

router.post('/:id/leader/nominate', retiredMutation);
router.post('/:id/leader/confirm', retiredMutation);
router.post('/:id/supervisor-invitations', retiredMutation);
router.post('/:id/supervisor-invitations/:invitationId/respond', retiredMutation);

module.exports = router;
