const express = require('express');
const { protect } = require('../middleware/auth');
const controller = require('../controllers/proposalController');

const router = express.Router();
// This router is mounted at /api. Attach protection to its concrete endpoints
// instead of router-wide middleware, so unrelated unknown API paths can reach
// the central JSON 404 handler rather than being mistaken for this router.
router.get('/projects/:projectId/proposals', protect, controller.getProposalVersions);
router.post('/projects/:projectId/proposals', protect, controller.createProposalDraft);
router.put('/proposals/:versionId', protect, controller.updateProposalDraft);
router.post('/proposals/:versionId/submit', protect, controller.submitProposal);
router.post('/proposals/:versionId/decision', protect, controller.decideProposal);

module.exports = router;
