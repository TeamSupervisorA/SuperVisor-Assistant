const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a team name'],
    trim: true
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  supervisor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['forming', 'pending_approval', 'active', 'completed', 'archived'],
    default: 'forming'
  },
  activeLeader: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
  pendingLeader: { type: mongoose.Schema.ObjectId, ref: 'User', default: null },
  members: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['Leader', 'Developer', 'Designer', 'Researcher'],
        default: 'Developer'
      },
      state: { type: String, enum: ['invited', 'active', 'removed'], default: 'active' }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

teamSchema.index({ project: 1, status: 1 });

module.exports = mongoose.model('Team', teamSchema);
