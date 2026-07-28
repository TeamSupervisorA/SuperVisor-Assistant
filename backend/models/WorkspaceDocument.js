const mongoose = require('mongoose');

const workspaceDocumentSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'A document title is required'],
    trim: true,
    maxlength: 180
  },
  kind: {
    type: String,
    enum: ['paper', 'code'],
    required: true
  },
  language: {
    type: String,
    default: 'latex',
    maxlength: 40
  },
  content: {
    type: String,
    default: '',
    maxlength: 500000
  },
  overleafUrl: {
    type: String,
    default: '',
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

workspaceDocumentSchema.index({ project: 1, updatedAt: -1 });

module.exports = mongoose.model('WorkspaceDocument', workspaceDocumentSchema);
