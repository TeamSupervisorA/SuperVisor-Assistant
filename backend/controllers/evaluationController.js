const Evaluation = require('../models/Evaluation');
const Project = require('../models/Project');
const { canAccessProject, projectIdsForUser } = require('../utils/projectAccess');

const scoreLimits = {
  problemUnderstanding: 10,
  methodology: 20,
  implementation: 30,
  documentation: 40
};

const normalizeScores = (scores, previousScores = {}) => {
  if (!scores || typeof scores !== 'object' || Array.isArray(scores)) {
    const error = new Error('scores must be an object');
    error.statusCode = 422;
    throw error;
  }
  const combined = { ...previousScores, ...scores };
  const normalized = {};
  for (const [field, max] of Object.entries(scoreLimits)) {
    const value = combined[field] ?? 0;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > max) {
      const error = new Error(`${field} must be a number between 0 and ${max}`);
      error.statusCode = 422;
      throw error;
    }
    normalized[field] = number;
  }
  return normalized;
};

const totalFor = (scores) => Object.values(scores).reduce((total, value) => total + value, 0);

// @desc    Get evaluations (students see evaluations of their projects)
// @route   GET /api/evaluations?project=<projectId>
// @access  Private
exports.getEvaluations = async (req, res) => {
  try {
    let query = {};

    if (req.query.project) {
      const project = await Project.findById(req.query.project);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!canAccessProject(project, req.user)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view evaluations for this project' });
      }
      query.project = project._id;
    }

    if (req.user.role === 'student') {
      const projects = await Project.find({ students: req.user.id }).select('_id');
      query.project = query.project || { $in: projects.map(p => p._id) };
    } else if (req.user.role === 'supervisor') {
      // A supervisor needs to see the assessment record for every project
      // they own, including an institutional assessment added by an admin.
      query.project = query.project || { $in: await projectIdsForUser(req.user) };
    }

    const evaluations = await Evaluation.find(query)
      .populate('project', 'title')
      .populate('evaluator', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: evaluations.length, data: evaluations });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

// @desc    Create evaluation
// @route   POST /api/evaluations
// @access  Private (supervisor/admin)
exports.createEvaluation = async (req, res) => {
  try {
    const { project: projectId, scores, feedback } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (req.user.role !== 'admin' && project.supervisor?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to evaluate this project' });
    }

    const normalizedScores = normalizeScores(scores);
    const totalScore = totalFor(normalizedScores);

    const evaluation = await Evaluation.create({
      project: projectId,
      evaluator: req.user.id,
      scores: normalizedScores,
      feedback,
      totalScore
    });

    res.status(201).json({ success: true, data: evaluation });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

// @desc    Update evaluation
// @route   PUT /api/evaluations/:id
// @access  Private (owning evaluator or admin)
exports.updateEvaluation = async (req, res) => {
  try {
    let evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({ success: false, error: 'Evaluation not found' });
    }

    if (req.user.role !== 'admin' && evaluation.evaluator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this evaluation' });
    }

    // Keep evaluator, project, total score, and timestamps server-owned. A
    // reviewer may revise only their rubric values and written feedback.
    const updates = {};
    if (Object.hasOwn(req.body, 'scores')) {
      const currentScores = evaluation.scores?.toObject ? evaluation.scores.toObject() : evaluation.scores;
      updates.scores = normalizeScores(req.body.scores, currentScores || {});
      updates.totalScore = totalFor(updates.scores);
    }
    if (Object.hasOwn(req.body, 'feedback')) {
      if (typeof req.body.feedback !== 'string') return res.status(422).json({ success: false, error: 'feedback must be text' });
      updates.feedback = req.body.feedback;
    }
    if (!Object.keys(updates).length) return res.status(422).json({ success: false, error: 'No supported evaluation fields were provided' });

    evaluation = await Evaluation.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true
    });

    res.status(200).json({ success: true, data: evaluation });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

// @desc    Delete evaluation
// @route   DELETE /api/evaluations/:id
// @access  Private (owning evaluator or admin)
exports.deleteEvaluation = async (req, res) => {
  try {
    const evaluation = await Evaluation.findById(req.params.id);

    if (!evaluation) {
      return res.status(404).json({ success: false, error: 'Evaluation not found' });
    }

    if (req.user.role !== 'admin' && evaluation.evaluator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this evaluation' });
    }

    await evaluation.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
