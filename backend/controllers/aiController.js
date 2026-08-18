const geminiService = require('../services/geminiService');
const { screenIntegrity } = require('../services/integrityService');
const AIInteraction = require('../models/AIInteraction');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const ProgressLog = require('../models/ProgressLog');
const User = require('../models/User');
const { Project, canAccessProject } = require('../utils/projectAccess');

const aiErrorStatus = (error) => {
  const status = Number(error?.status || error?.statusCode || error?.error?.code);
  return status === 429 || /RESOURCE_EXHAUSTED|quota|\b429\b/i.test(error?.message) ? 429 : 503;
};
const aiErrorMessage = (error) => aiErrorStatus(error) === 429
  ? 'The AI service quota has been reached. Please try again later or ask an administrator to review Gemini billing and rate limits.'
  : 'The AI service is temporarily unavailable. Please try again later.';
const userGuidance = (req) => req.user?.settings?.systemPrompt || '';

// Settings are user-owned preferences, so a person who turns an assistant
// feature off should not be able to invoke the same capability by calling the
// API directly.
const requireEnabledFeature = (req, res, setting, label) => {
  if (req.user?.settings?.[setting] !== false) return true;
  res.status(403).json({
    success: false,
    error: `${label} is disabled in your settings. Enable it in Settings to continue.`
  });
  return false;
};

const recordInteraction = async (req, feature, input, result) => {
  try {
    await AIInteraction.create({
      feature,
      actor: req.user.id,
      project: req.body?.project || undefined,
      model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      input,
      ...result
    });
  } catch (error) {
    console.error('AI interaction write failed:', error.message);
  }
};

exports.getInteractions = async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? { actor: { $in: await User.find({ institution: req.user.institution || null }).distinct('_id') } }
      : { actor: req.user.id };
    if (req.query.project) {
      const project = await Project.findById(req.query.project);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to view this project interaction history' });
      query.project = project._id;
    }
    const interactions = await AIInteraction.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: interactions });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

exports.getStatus = (req, res) => {
  const status = geminiService.getStatus();
  res.json({ success: true, data: status });
};

exports.academicAssistant = async (req, res) => {
  try {
    if (!requireEnabledFeature(req, res, 'aiChatbot', 'AI Supervisor Assistant')) return;
    const message = String(req.body?.message || '').trim();
    const mode = String(req.body?.mode || 'research').toLowerCase();
    if (!message) return res.status(422).json({ success: false, error: 'Write a question or describe the decision you need help with' });
    if (message.length > 6000) return res.status(422).json({ success: false, error: 'Assistant messages are limited to 6,000 characters' });
    if (!['research', 'career', 'planning'].includes(mode)) return res.status(422).json({ success: false, error: 'Mode must be research, career, or planning' });

    let projectContext = null;
    if (req.body?.project) {
      const project = await Project.findById(req.body.project).populate('supervisor', 'name').populate('students', 'name');
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to use this project context' });
      const [tasks, submissions, progressLogs] = await Promise.all([
        Task.find({ project: project._id }).select('title status dueDate assignedTo').sort({ dueDate: 1 }).limit(30).lean(),
        Submission.find({ project: project._id }).select('title status grade submittedAt').sort({ submittedAt: -1 }).limit(12).lean(),
        ProgressLog.find({ project: project._id }).select('summary blockers state weekStart').sort({ weekStart: -1 }).limit(8).lean()
      ]);
      projectContext = {
        title: project.title,
        description: project.description,
        status: project.status,
        proposalState: project.proposalState,
        department: project.department,
        section: project.section,
        supervisor: project.supervisor?.name || null,
        teamMembers: project.students.map((student) => student.name),
        tasks,
        submissions,
        progressLogs
      };
    }
    const recentHistory = Array.isArray(req.body?.history) ? req.body.history.slice(-10).map((item) => ({
      role: item?.role === 'assistant' ? 'assistant' : 'user',
      content: String(item?.content || '').slice(0, 1200)
    })) : [];
    const result = await geminiService.academicAssistant({
      message,
      mode,
      role: req.user.role,
      userProfile: { name: req.user.name, department: req.user.department, studentId: req.user.role === 'student' ? req.user.studentId : undefined },
      projectContext,
      recentHistory,
      guidance: userGuidance(req)
    });
    await recordInteraction(req, `assistant_${mode}`, { messageLength: message.length, hasProjectContext: Boolean(projectContext), role: req.user.role }, { output: result, status: 'succeeded' });
    res.json({ success: true, data: result });
  } catch (error) {
    await recordInteraction(req, `assistant_${req.body?.mode || 'research'}`, { messageLength: String(req.body?.message || '').length }, { status: 'failed', error: error.message });
    res.status(aiErrorStatus(error)).json({ success: false, error: aiErrorMessage(error) });
  }
};

// @desc    Humanize text
// @route   POST /api/ai/humanize
// @access  Private
exports.humanizeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || String(text).trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Text is required.' });
    }
    
    const result = await geminiService.humanizeText(text);
    await recordInteraction(req, 'humanize_text', { textLength: text.length }, { output: result, status: 'succeeded' });
    
    res.json({ success: true, data: result });
  } catch (error) {
    await recordInteraction(req, 'humanize_text', { textLength: req.body?.text?.length || 0 }, { status: 'failed', error: error.message });
    res.status(aiErrorStatus(error)).json({ success: false, error: aiErrorMessage(error) });
  }
};


exports.rateInteraction = async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(422).json({ success: false, error: 'Rating must be an integer from 1 to 5' });
    const interaction = await AIInteraction.findOneAndUpdate({ _id: req.params.id, actor: req.user.id }, { rating }, { returnDocument: 'after' });
    if (!interaction) return res.status(404).json({ success: false, error: 'AI interaction not found' });
    res.json({ success: true, data: interaction });
  } catch (error) { res.status(400).json({ success: false, error: error.message }); }
};

// @desc    Generate feedback for a submission
// @route   POST /api/ai/feedback
// @access  Private
exports.generateFeedback = async (req, res) => {
  try {
    if (!requireEnabledFeature(req, res, 'aiChatbot', 'AI Supervisor Chatbot')) return;
    const { text, criteria } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Please provide submission text' });
    }

    const feedback = await geminiService.generateFeedback(text, criteria || 'General academic quality and clarity', userGuidance(req));

    await recordInteraction(req, 'feedback', { criteria: criteria || 'General academic quality and clarity', textLength: text.length }, { output: feedback, status: 'succeeded' });

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    await recordInteraction(req, 'feedback', { textLength: req.body?.text?.length || 0 }, { status: 'failed', error: error.message });
    res.status(aiErrorStatus(error)).json({ success: false, error: aiErrorMessage(error) });
  }
};

// @desc    Check plagiarism
// @route   POST /api/ai/plagiarism
// @access  Private (Teacher/Admin only)
exports.checkPlagiarism = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Please provide text to check' });
    }

    // This compatibility endpoint has no project corpus. The formal checker at
    // /api/plagiarism adds project-scoped stored-submission comparison.
    const result = await screenIntegrity({ text, comparisonSubmissions: [] });

    await recordInteraction(req, 'plagiarism', { textLength: text.length }, { output: result, status: 'succeeded' });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    await recordInteraction(req, 'plagiarism', { textLength: req.body?.text?.length || 0 }, { status: 'failed', error: error.message });
    res.status(aiErrorStatus(error)).json({ success: false, error: aiErrorMessage(error) });
  }
};

// @desc    Suggest project ideas
// @route   POST /api/ai/suggest-ideas
// @access  Private
exports.suggestIdeas = async (req, res) => {
  try {
    if (!requireEnabledFeature(req, res, 'ideaGenerator', 'Project Idea Generator')) return;
    const { interests, department } = req.body;
    if (!interests || !department) {
      return res.status(400).json({ success: false, error: 'Please provide interests and department' });
    }
    const suggestions = await geminiService.suggestProjectIdeas(interests, department, userGuidance(req));
    await recordInteraction(req, 'project_ideas', { interests, department }, { output: suggestions, status: 'succeeded' });
    res.status(200).json({ success: true, data: suggestions });
  } catch (error) {
    await recordInteraction(req, 'project_ideas', { interests: req.body?.interests, department: req.body?.department }, { status: 'failed', error: error.message });
    res.status(aiErrorStatus(error)).json({ success: false, error: aiErrorMessage(error) });
  }
};

// @desc    Review project proposal
// @route   POST /api/ai/review-proposal
// @access  Private
exports.reviewProposal = async (req, res) => {
  try {
    if (!requireEnabledFeature(req, res, 'proposalFeedback', 'Proposal Feedback')) return;
    const { proposalText } = req.body;
    if (!proposalText) {
      return res.status(400).json({ success: false, error: 'Please provide proposalText' });
    }
    const feedback = await geminiService.generateProposalFeedback(proposalText, userGuidance(req));
    await recordInteraction(req, 'proposal_feedback', { proposalText }, { output: feedback, status: 'succeeded' });
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    await recordInteraction(req, 'proposal_feedback', { proposalText: req.body?.proposalText }, { status: 'failed', error: error.message });
    res.status(aiErrorStatus(error)).json({ success: false, error: aiErrorMessage(error) });
  }
};

// Produce a planning outline, not a finished proposal. The student remains the
// author and can revise the result before saving a proposal version.
exports.generateProposalOutline = async (req, res) => {
  try {
    if (!requireEnabledFeature(req, res, 'proposalFeedback', 'Proposal Feedback')) return;
    const outline = await geminiService.generateProposalOutline({
      topic: req.body?.topic,
      department: req.user.department || req.body?.department || 'General Studies',
      constraints: req.body?.constraints,
      guidance: userGuidance(req)
    });
    await recordInteraction(req, 'proposal_outline', { topic: req.body?.topic, department: req.user.department || req.body?.department }, { output: outline, status: 'succeeded' });
    res.json({ success: true, data: outline });
  } catch (error) {
    await recordInteraction(req, 'proposal_outline', { topic: req.body?.topic }, { status: 'failed', error: error.message });
    res.status(aiErrorStatus(error) === 503 && /required|too long/i.test(error.message) ? 422 : aiErrorStatus(error)).json({ success: false, error: /required|too long/i.test(error.message) ? error.message : aiErrorMessage(error) });
  }
};

// The report draft is generated from the server's project records, not arbitrary
// browser-supplied metrics. Both students and the assigned supervisor see the
// same factual context for the shared project.
exports.generateProjectReportDraft = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('supervisor', 'name').populate('students', 'name');
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) return res.status(403).json({ success: false, error: 'Not authorized to generate a report draft for this project' });
    const [tasks, submissions, logs] = await Promise.all([
      Task.find({ project: project._id }).select('title status dueDate').lean(),
      Submission.find({ project: project._id }).select('title status grade submittedAt').lean(),
      ProgressLog.find({ project: project._id }).select('summary blockers state weekStart').sort({ weekStart: -1 }).limit(12).lean()
    ]);
    const context = {
      project: { title: project.title, description: project.description, status: project.status, supervisor: project.supervisor?.name || null, students: project.students.map((student) => student.name) },
      tasks,
      submissions,
      progressLogs: logs
    };
    const draft = await geminiService.generateReportNarrative(context, userGuidance(req));
    await recordInteraction(req, 'report_draft', { project: project._id, taskCount: tasks.length, submissionCount: submissions.length, progressLogCount: logs.length }, { output: draft, status: 'succeeded' });
    res.json({ success: true, data: { draft, generatedFrom: { tasks: tasks.length, submissions: submissions.length, progressLogs: logs.length } } });
  } catch (error) {
    await recordInteraction(req, 'report_draft', { project: req.params.projectId }, { status: 'failed', error: error.message });
    res.status(error?.statusCode || aiErrorStatus(error)).json({ success: false, error: aiErrorMessage(error) });
  }
};

// @desc    Recommend next task
// @route   POST /api/ai/recommend-task
// @access  Private
exports.recommendTask = async (req, res) => {
  try {
    const { currentStatus, pastTasks } = req.body;
    if (!currentStatus || !pastTasks || !Array.isArray(pastTasks)) {
      return res.status(400).json({ success: false, error: 'Please provide currentStatus and an array of pastTasks' });
    }
    const recommendation = await geminiService.recommendNextTask(currentStatus, pastTasks, userGuidance(req));
    await recordInteraction(req, 'next_task', { currentStatus, pastTasks }, { output: recommendation, status: 'succeeded' });
    res.status(200).json({ success: true, data: recommendation });
  } catch (error) {
    await recordInteraction(req, 'next_task', { currentStatus: req.body?.currentStatus, pastTasks: req.body?.pastTasks }, { status: 'failed', error: error.message });
    res.status(aiErrorStatus(error)).json({ success: false, error: aiErrorMessage(error) });
  }
};
