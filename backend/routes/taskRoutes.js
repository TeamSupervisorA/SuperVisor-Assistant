const express = require('express');
const {
  getTasks,
  createTask,
  updateTask,
  transitionTask,
  requestTaskReview,
  withdrawTaskReview,
  decideTaskReview,
  decideTaskSuggestion,
  addTaskComment,
  addTaskEvidence,
  deleteTask
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(createTask); // controller verifies the user can access the target project

router.route('/:id')
  .put(updateTask) // students may update status of their own tasks
  .delete(deleteTask);

router.post('/:id/transition', transitionTask);
router.post('/:id/request-review', requestTaskReview);
router.post('/:id/withdraw-review', withdrawTaskReview);
router.post('/:id/review-decision', authorize('supervisor', 'admin'), decideTaskReview);
router.post('/:id/suggestion-decision', decideTaskSuggestion);
router.post('/:id/comments', addTaskComment);
router.post('/:id/evidence', addTaskEvidence);

module.exports = router;
