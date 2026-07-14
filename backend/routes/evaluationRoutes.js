const express = require('express');
const {
  getEvaluations,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation
} = require('../controllers/evaluationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getEvaluations)
  .post(authorize('supervisor', 'admin'), createEvaluation);

router.route('/:id')
  .put(authorize('supervisor', 'admin'), updateEvaluation)
  .delete(authorize('supervisor', 'admin'), deleteEvaluation);

module.exports = router;
