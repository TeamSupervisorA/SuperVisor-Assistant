const express = require('express');
const { protect } = require('../middleware/auth');
const workspace = require('../controllers/workspaceController');

const router = express.Router();
router.use(protect);

router.route('/projects/:projectId/documents')
  .get(workspace.listDocuments)
  .post(workspace.createDocument);
router.route('/documents/:id')
  .get(workspace.getDocument)
  .put(workspace.updateDocument)
  .delete(workspace.deleteDocument);

module.exports = router;
