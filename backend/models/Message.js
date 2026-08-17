const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [5000, 'A chat message cannot exceed 5,000 characters']
  },
  references: [{
    kind: { type: String, enum: ['resource', 'submission', 'task', 'proposal', 'meeting'], required: true },
    entityId: { type: mongoose.Schema.ObjectId, required: true },
    label: { type: String, trim: true, maxlength: 180, default: '' }
  }],
  eventType: { type: String, enum: ['message', 'project_event'], default: 'message' },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
