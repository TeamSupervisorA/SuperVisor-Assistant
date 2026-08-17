const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 180 },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Institution slug must contain lowercase letters, numbers, and hyphens only']
  },
  emailDomains: [{ type: String, lowercase: true, trim: true }],
  status: { type: String, enum: ['active', 'suspended', 'archived'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

institutionSchema.index({ emailDomains: 1 });

module.exports = mongoose.model('Institution', institutionSchema);
