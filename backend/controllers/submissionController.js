const Submission = require('../models/Submission');
const Task = require('../models/Task');
const { Project, canAccessProject, projectIdsForUser } = require('../utils/projectAccess');
const Notification = require('../models/Notification');

// Notifications are best-effort — never fail the main operation over one
const notify = async (fields) => {
  try {
    await Notification.create(fields);
  } catch (e) { /* non-fatal */ }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) {
      const project = await Project.findById(req.query.project);
      if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
      if (!canAccessProject(project, req.user)) {
        return res.status(403).json({ success: false, error: 'Not authorized to view this project\'s submissions' });
      }
      filter.project = req.query.project;
    }
    // Students only see their own submissions
    if (req.user.role === 'student') filter.student = req.user.id;
    else if (req.user.role === 'supervisor') filter.project = filter.project || { $in: await projectIdsForUser(req.user) };

    const submissions = await Submission.find(filter).populate('student', 'name email').populate('project', 'title').sort({ submittedAt: -1 });
    res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createSubmission = async (req, res) => {
  try {
    const project = await Project.findById(req.body.project);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to submit to this project' });
    }

    const { title, task, fileUrl } = req.body;
    if (task) {
      const projectTask = await Task.findOne({ _id: task, project: project._id });
      if (!projectTask) return res.status(422).json({ success: false, error: 'The selected task does not belong to this project' });
    }
    // Submission metadata is owned by the server: a student must never be able
    // to pre-grade a submission, submit as another user, or change its project.
    const submission = await Submission.create({
      title,
      task,
      fileUrl,
      project: project._id,
      student: req.user.id
    });

    // Let the supervisor know a new deliverable is waiting for review
    if (project.supervisor) {
      await notify({
        user: project.supervisor,
        title: 'New submission to review',
        message: `${req.user.name} submitted "${submission.title}" for "${project.title}".`,
        type: 'info',
        link: '/evaluations'
      });
    }

    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateSubmission = async (req, res) => {
  try {
    let submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });

    const project = await Project.findById(submission.project);
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this submission' });
    }

    let updates;
    if (req.user.role === 'student') {
      // Students may only edit their own submission, and never grading fields
      if (submission.student.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to update this submission' });
      }
      const studentFields = ['title', 'task', 'fileUrl'];
      updates = Object.fromEntries(Object.entries(req.body).filter(([field]) => studentFields.includes(field)));
    } else {
      const reviewerFields = ['grade', 'feedback', 'status'];
      updates = Object.fromEntries(Object.entries(req.body).filter(([field]) => reviewerFields.includes(field)));
    }
    if (Object.keys(updates).length === 0) {
      return res.status(422).json({ success: false, error: 'No supported submission fields were provided' });
    }
    if (updates.task) {
      const projectTask = await Task.findOne({ _id: updates.task, project: submission.project });
      if (!projectTask) return res.status(422).json({ success: false, error: 'The selected task does not belong to this project' });
    }

    const wasGraded = req.user.role !== 'student' && (
      updates.grade || updates.feedback || ['Graded', 'Needs Revision'].includes(updates.status)
    );
    submission = await Submission.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after', runValidators: true });

    if (wasGraded) {
      await notify({
        user: submission.student,
        title: updates.status === 'Needs Revision' ? 'Revision requested' : 'Feedback received',
        message: `Your submission "${submission.title}" has been reviewed${updates.grade ? ` — grade: ${updates.grade}` : ''}.`,
        type: updates.status === 'Needs Revision' ? 'warning' : 'success',
        link: '/student-submissions'
      });
    }

    res.status(200).json({ success: true, data: submission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found' });

    const project = await Project.findById(submission.project);
    if (!canAccessProject(project, req.user)) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this submission' });
    }

    if (req.user.role === 'student' && submission.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this submission' });
    }

    await submission.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
