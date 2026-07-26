const express = require('express');
const { protect } = require('../middleware/auth');
const controller = require('../controllers/proposalController');

const router = express.Router();
router.use(protect);
router.get('/projects/:projectId/proposals', controller.getProposalVersions);
router.post('/projects/:projectId/proposals', controller.createProposalDraft);
router.put('/proposals/:versionId', controller.updateProposalDraft);
router.post('/proposals/:versionId/submit', controller.submitProposal);
router.post('/proposals/:versionId/decision', controller.decideProposal);

module.exports = router;
