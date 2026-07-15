const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Meeting = require('../models/Meeting');

exports.getAdminMetrics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'supervisor' });
    const activeProjects = await Project.countDocuments({ status: { $in: ['pending', 'in_progress'] } });
    
    // In a real app we'd query for submissions, we'll mock these for now
    const assignmentsSubmitted = 312;
    const plagiarismAlerts = 5;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        activeProjects,
        assignmentsSubmitted,
        plagiarismAlerts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getSupervisorMetrics = async (req, res) => {
  try {
    const supervisorId = req.user._id;
    
    // Count projects where this user is the supervisor
    const assignedTeams = await Project.countDocuments({ supervisor: supervisorId });
    
    // Just mock others for now since we don't have full meeting/submission schemas yet
    const pendingReviews = 8;
    const plagiarismAlerts = 3;
    const upcomingMeetings = 2;

    res.status(200).json({
      success: true,
      data: {
        assignedTeams,
        pendingReviews,
        plagiarismAlerts,
        upcomingMeetings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStudentMetrics = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Count projects the student is part of
    const activeProjects = await Project.countDocuments({
      students: studentId,
      status: { $in: ['pending', 'in_progress'] }
    });

    // Count tasks
    const totalTasks = await Task.countDocuments({ assignee: studentId });
    const completedTasks = await Task.countDocuments({ assignee: studentId, status: 'completed' });

    // Pending feedback (submitted but not graded)
    const pendingFeedback = await Submission.countDocuments({
      student: studentId,
      status: { $in: ['Pending', 'In Review'] }
    });

    // Next deadline — find nearest future task due date
    const nextTask = await Task.findOne({
      assignee: studentId,
      status: { $ne: 'completed' },
      dueDate: { $gte: new Date() }
    }).sort({ dueDate: 1 }).lean();

    const daysUntilDeadline = nextTask?.dueDate
      ? Math.max(0, Math.ceil((new Date(nextTask.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))
      : null;

    res.status(200).json({
      success: true,
      data: {
        activeProjects,
        completedTasks,
        totalTasks,
        pendingFeedback,
        daysUntilDeadline,
        nextMilestone: nextTask?.title || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
