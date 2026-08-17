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
  removeProjectMember,
  respondToMemberInvitation,
  inviteProjectSupervisor,
  getMyProjectInvitations,
  respondToSupervisorInvitation,
  getProjectAuditHistory,
  transferProjectLeadership
} = require('../controllers/projectController');
const { createProjectMilestone } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/explore', require('../controllers/projectController').exploreProjects);
router.get('/invitations/mine', getMyProjectInvitations);

router.route('/')
  .get(getProjects)
  .post(authorize('student', 'supervisor', 'admin'), createProject);

router.post('/:id/claim', authorize('admin'), claimProject);

router.route('/:id')
  .get(getProject)
  .put(authorize('supervisor', 'admin'), updateProject)
  .delete(authorize('supervisor', 'admin'), deleteProject);

router.get('/:id/report', getProjectReport);
router.get('/:id/history', getProjectAuditHistory);
router.put('/:id/leader', transferProjectLeadership);
router.post('/:id/milestones', createProjectMilestone);

router.post('/:id/members', addProjectMember);
router.post('/:id/members/:invitationId/respond', respondToMemberInvitation);
router.delete('/:id/members/:userId', removeProjectMember);
router.post('/:id/supervisor-invitations', inviteProjectSupervisor);
router.post('/:id/supervisor-invitations/:invitationId/respond', authorize('supervisor'), respondToSupervisorInvitation);

module.exports = router;
