const express = require('express');
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(authorize('supervisor', 'admin'), createTask);

router.route('/:id')
  .put(updateTask) // students may update status of their own tasks
  .delete(authorize('supervisor', 'admin'), deleteTask);

module.exports = router;
