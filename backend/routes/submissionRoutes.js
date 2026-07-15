const express = require('express');
const { protect } = require('../middleware/auth');
const submissionController = require('../controllers/submissionController');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(submissionController.getAllSubmissions)
  .post(submissionController.createSubmission);

router
  .route('/:id')
  .put(submissionController.updateSubmission)
  .delete(submissionController.deleteSubmission);

module.exports = router;
