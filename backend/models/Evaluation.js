const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  evaluator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  submission: { type: mongoose.Schema.ObjectId, ref: 'Submission', default: null },
  scores: { type: mongoose.Schema.Types.Mixed, required: true },
  rubricVersion: { type: Number, default: 1 },
  rubricSnapshot: {
    type: [{
      _id: false,
      key: String,
      label: String,
      maxScore: Number,
      description: String
    }],
    default: []
  },
  feedback: {
    type: String
  },
  totalScore: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', evaluationSchema);
