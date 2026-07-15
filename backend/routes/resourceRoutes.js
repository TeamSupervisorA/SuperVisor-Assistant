const express = require('express');
const { protect } = require('../middleware/auth');
const resourceController = require('../controllers/resourceController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(resourceController.getAllResources)
  .post(resourceController.createResource);

router
  .route('/:id')
  .delete(resourceController.deleteResource);

module.exports = router;
