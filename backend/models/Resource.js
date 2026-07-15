const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title']
  },
  type: {
    type: String,
    enum: ['PDF', 'Link', 'Document', 'Code', 'Other'],
    default: 'Document'
  },
  url: {
    type: String,
    required: [true, 'Please add a URL or path']
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    enum: ['Research', 'Methodology', 'Implementation', 'General'],
    default: 'General'
  },
  size: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resource', resourceSchema);
