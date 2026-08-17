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
  requestedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  overallSimilarity: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  summary: { type: String, default: '' },
  method: { type: String, default: 'Gemini Google Search-grounded integrity screen' },
  providerModel: { type: String, default: '' },
  disclaimer: { type: String, default: '' },
  sourcesSearched: [{ sourceName: String, sourceUrl: String }],
  searchQueryCount: { type: Number, min: 0, default: 0 },
  searchSuggestionsHtml: { type: String, default: '', maxlength: 50000 },
  coverage: [{ type: String, maxlength: 300 }],
  providerNotice: { type: String, default: '', maxlength: 1000 },
  checkedCharacterCount: { type: Number, min: 0, default: 0 },
  contentHash: { type: String, select: false },
  isCurrent: { type: Boolean, default: true, index: true },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  matchedSources: [{
    sourceName: String,
    sourceUrl: String,
    sourceType: { type: String, enum: ['project-corpus', 'public-web'], default: 'public-web' },
    sourceSubmission: { type: mongoose.Schema.ObjectId, ref: 'Submission' },
    matchPercentage: Number,
    reason: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

plagiarismReportSchema.index({ submission: 1, contentHash: 1, status: 1 });
plagiarismReportSchema.index({ project: 1, createdAt: -1 });
plagiarismReportSchema.index(
  { submission: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'Pending' } }
);

module.exports = mongoose.model('PlagiarismReport', plagiarismReportSchema);
