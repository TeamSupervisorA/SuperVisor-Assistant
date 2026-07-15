const mongoose = require('mongoose');

const plagiarismReportSchema = new mongoose.Schema({
  submission: {
    type: mongoose.Schema.ObjectId,
    ref: 'Submission',
    required: true
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  overallSimilarity: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  matchedSources: [{
    sourceName: String,
    sourceUrl: String,
    matchPercentage: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PlagiarismReport', plagiarismReportSchema);
