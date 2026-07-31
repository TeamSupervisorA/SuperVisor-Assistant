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
  summary: { type: String, default: '' },
  method: { type: String, default: 'Gemini Google Search-grounded integrity screen' },
  disclaimer: { type: String, default: '' },
  sourcesSearched: [{ sourceName: String, sourceUrl: String }],
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  matchedSources: [{
    sourceName: String,
    sourceUrl: String,
    matchPercentage: Number,
    reason: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PlagiarismReport', plagiarismReportSchema);
