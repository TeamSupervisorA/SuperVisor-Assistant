const Course = require('../models/Course');
const User = require('../models/User');
const { sendServerError } = require('../utils/errorResponse');
const { recordAudit } = require('../services/auditService');
const { defaultRubric } = require('../models/Course');

const normalizeRubric = (rubric, previous) => {
  if (rubric === undefined) return undefined;
  const criteria = Array.isArray(rubric?.criteria) ? rubric.criteria : null;
  if (!criteria || criteria.length < 1 || criteria.length > 12) {
    const error = new Error('A rubric must contain between 1 and 12 criteria');
    error.statusCode = 422;
    throw error;
  }
  const keys = new Set();
  const normalized = criteria.map((criterion) => {
    const key = String(criterion.key || '').trim().replace(/[^a-zA-Z0-9_-]/g, '');
    const label = String(criterion.label || '').trim();
    const maxScore = Number(criterion.maxScore);
    if (!key || !label || keys.has(key) || !Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 100) {
      const error = new Error('Each rubric criterion needs a unique key, a label and a maximum score from 1 to 100');
      error.statusCode = 422;
      throw error;
    }
    keys.add(key);
    return { key, label, maxScore, description: String(criterion.description || '').trim() };
  });
  const total = normalized.reduce((sum, item) => sum + item.maxScore, 0);
  if (total !== 100) {
    const error = new Error('Rubric maximum scores must total 100');
    error.statusCode = 422;
    throw error;
  }
  return { version: Number(previous?.version || 0) + 1, criteria: normalized };
};

const validateLeadInstructor = async (leadInstructor, institution) => {
  if (leadInstructor === undefined || leadInstructor === null || leadInstructor === '') return undefined;
  const user = await User.findOne({ _id: leadInstructor, institution, role: { $in: ['supervisor', 'admin'] }, status: 'active' }).select('_id');
  if (!user) {
    const error = new Error('Lead instructor must be an active supervisor or administrator');
    error.statusCode = 422;
    throw error;
  }
  return user._id;
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ institution: req.user.institution || null }).populate('leadInstructor', 'name email');
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load courses');
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { code, name, department, sections, leadInstructor } = req.body;
    const rubric = normalizeRubric(req.body.rubric, { version: 0 }) || { version: 1, criteria: defaultRubric() };
    const course = await Course.create({ institution: req.user.institution || null, code, name, department, sections, leadInstructor: await validateLeadInstructor(leadInstructor, req.user.institution || null), rubric });
    await recordAudit({ actor: req.user.id, action: 'course.created', entityType: 'course', entityId: course._id });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const permittedFields = ['code', 'name', 'department', 'sections', 'leadInstructor', 'rubric'];
    const updates = Object.fromEntries(
      permittedFields
        .filter((field) => Object.prototype.hasOwnProperty.call(req.body, field))
        .map((field) => [field, req.body[field]])
    );
    if (Object.keys(updates).length === 0) {
      return res.status(422).json({ success: false, error: 'No supported course fields were provided' });
    }
    if (Object.hasOwn(updates, 'leadInstructor')) updates.leadInstructor = await validateLeadInstructor(updates.leadInstructor, req.user.institution || null);
    if (Object.hasOwn(updates, 'rubric')) {
      const existing = await Course.findOne({ _id: req.params.id, institution: req.user.institution || null }).select('rubric');
      if (!existing) return res.status(404).json({ success: false, error: 'Course not found' });
      updates.rubric = normalizeRubric(updates.rubric, existing.rubric);
    }
    const course = await Course.findOneAndUpdate({ _id: req.params.id, institution: req.user.institution || null }, updates, {
      returnDocument: 'after',
      runValidators: true
    });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    await recordAudit({ actor: req.user.id, action: 'course.updated', entityType: 'course', entityId: course._id, metadata: { fields: Object.keys(updates) } });
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, institution: req.user.institution || null });
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    await recordAudit({ actor: req.user.id, action: 'course.deleted', entityType: 'course', entityId: course._id });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(error.statusCode || 400).json({ success: false, error: error.message });
  }
};
