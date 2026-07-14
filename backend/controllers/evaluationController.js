const Evaluation = require('../models/Evaluation');
const Project = require('../models/Project');

// @desc    Get evaluations (students see evaluations of their projects)
// @route   GET /api/evaluations?project=<projectId>
// @access  Private
exports.getEvaluations = async (req, res) => {
  try {
    let query = {};

    if (req.query.project) {
      query.project = req.query.project;
    }

    if (req.user.role === 'student') {
      const projects = await Project.find({ students: req.user.id }).select('_id');
      query.project = query.project || { $in: projects.map(p => p._id) };
    } else if (req.user.role === 'supervisor') {
      query.evaluator = req.user.id;
    }

    const evaluations = await Evaluation.find(query)
      .populate('project', 'title')
      .populate('evaluator', 'name email');

    res.status(200).json({ success: true, count: evaluations.length, data: evaluations });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
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

    if (req.user.role !== 'admin' && project.supervisor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to evaluate this project' });
    }

    const totalScore =
      (scores?.problemUnderstanding || 0) +
      (scores?.methodology || 0) +
      (scores?.implementation || 0) +
      (scores?.documentation || 0);

    const evaluation = await Evaluation.create({
      project: projectId,
      evaluator: req.user.id,
      scores,
      feedback,
      totalScore
    });

    res.status(201).json({ success: true, data: evaluation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
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

    const updates = { ...req.body };
    if (updates.scores) {
      updates.totalScore =
        (updates.scores.problemUnderstanding || 0) +
        (updates.scores.methodology || 0) +
        (updates.scores.implementation || 0) +
        (updates.scores.documentation || 0);
    }

    evaluation = await Evaluation.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: evaluation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
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
