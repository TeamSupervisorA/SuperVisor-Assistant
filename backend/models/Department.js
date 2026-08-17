const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null, index: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  name: { type: String, required: true, trim: true },
  status: { type: String, enum: ['active', 'archived'], default: 'active' }
}, { timestamps: true });

departmentSchema.index({ institution: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
