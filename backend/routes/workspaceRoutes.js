const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const workspace = require('../controllers/workspaceController');

const router = express.Router();
router.use(protect);

router.route('/projects/:projectId/documents')
  .get(workspace.listDocuments)
  .post(workspace.createDocument);
router.get('/runtime-status', workspace.getRuntimeStatus);
router.post('/documents/:id/compile', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'Too many compile requests. Please wait before compiling again.' }
}), workspace.compileDocument);
router.post('/documents/:id/run', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, error: 'Too many code execution requests. Please wait before running again.' }
}), workspace.runDocument);
router.route('/documents/:id')
  .get(workspace.getDocument)
  .put(workspace.updateDocument)
  .delete(workspace.deleteDocument);

module.exports = router;
