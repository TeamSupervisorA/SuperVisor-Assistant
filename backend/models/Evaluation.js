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
  scores: {
    problemUnderstanding: { type: Number, min: 0, max: 10 },
    methodology: { type: Number, min: 0, max: 20 },
    implementation: { type: Number, min: 0, max: 30 },
    documentation: { type: Number, min: 0, max: 40 }
  },
  feedback: {
    type: String
  },
  totalScore: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
