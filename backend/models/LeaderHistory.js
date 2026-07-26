const mongoose = require('mongoose');

const leaderHistorySchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, trim: true },
  changedAt: { type: Date, default: Date.now, immutable: true }
}, { versionKey: false });

module.exports = mongoose.model('LeaderHistory', leaderHistorySchema);
