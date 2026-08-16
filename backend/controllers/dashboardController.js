const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Meeting = require('../models/Meeting');
const PlagiarismReport = require('../models/PlagiarismReport');
const { sendServerError } = require('../utils/errorResponse');

exports.getAdminMetrics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'supervisor' });
    const activeProjects = await Project.countDocuments({ status: { $in: ['proposed', 'active'] } });
    
    // Real counts from submissions and plagiarism reports
    const assignmentsSubmitted = await Submission.countDocuments();
    const plagiarismAlerts = await PlagiarismReport.countDocuments({
      status: 'Completed',
      overallSimilarity: { $gte: 20 }
    });

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
    return sendServerError(res, error, 'Unable to load administrator dashboard data');
  }
};

exports.getSupervisorMetrics = async (req, res) => {
  try {
    const supervisorId = req.user._id;

    // Count projects where this user is the supervisor
    const assignedTeams = await Project.countDocuments({ supervisor: supervisorId });

    const supervisedProjects = await Project.find({ supervisor: supervisorId })
      .select('_id title status students')
      .lean();
    const projectIds = supervisedProjects.map(p => p._id);

    // Submissions awaiting review on supervised projects
    const pendingReviews = await Submission.countDocuments({
      project: { $in: projectIds },
      status: { $in: ['Submitted', 'Under Review'] }
    });

    // Upcoming meetings for supervised projects
    const upcomingMeetings = await Meeting.countDocuments({
      project: { $in: projectIds },
      status: 'Upcoming',
      date: { $gte: new Date() }
    });

    // Plagiarism alerts: completed reports above a similarity threshold
    const plagiarismAlerts = await PlagiarismReport.countDocuments({
      project: { $in: projectIds },
      status: 'Completed',
      overallSimilarity: { $gte: 20 }
    });

    const projectHealth = await Promise.all(supervisedProjects.map(async (project) => {
      const [totalTasks, completedTasks, delayedTasks, pendingSubmissions] = await Promise.all([
        Task.countDocuments({ project: project._id }),
        Task.countDocuments({ project: project._id, status: { $in: ['done', 'completed'] } }),
        Task.countDocuments({
          project: project._id,
          dueDate: { $lt: new Date() },
          status: { $nin: ['done', 'completed', 'cancelled'] }
        }),
        Submission.countDocuments({ project: project._id, status: { $in: ['Submitted', 'Under Review', 'Needs Revision'] } })
      ]);
      return {
        projectId: project._id,
        title: project.title,
        status: project.status,
        studentCount: project.students?.length || 0,
        totalTasks,
        completedTasks,
        delayedTasks,
        pendingSubmissions,
        progress: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0
      };
    }));
    const delayedTasks = projectHealth.reduce((total, project) => total + project.delayedTasks, 0);
    const recentSubmissions = await Submission.find({ project: { $in: projectIds } })
      .sort({ submittedAt: -1 })
      .limit(6)
      .populate('project', 'title')
      .populate('student', 'name')
      .select('title status submittedAt project student')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        assignedTeams,
        pendingReviews,
        delayedTasks,
        plagiarismAlerts,
        upcomingMeetings,
        projectHealth,
        recentSubmissions
      }
    });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load supervisor dashboard data');
  }
};

exports.getStudentMetrics = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Count projects the student is part of
    const activeProjects = await Project.countDocuments({
      students: studentId,
      status: { $in: ['proposed', 'active'] }
    });

    // Count tasks
    const totalTasks = await Task.countDocuments({ assignedTo: studentId });
    const completedTasks = await Task.countDocuments({ assignedTo: studentId, status: { $in: ['done', 'completed'] } });

    // Pending feedback (submitted but not graded)
    const pendingFeedback = await Submission.countDocuments({
      student: studentId,
      status: { $in: ['Submitted', 'Under Review'] }
    });

    // Next deadline — find nearest future task due date
    const nextTask = await Task.findOne({
      assignedTo: studentId,
      status: { $nin: ['done', 'completed', 'cancelled'] },
      dueDate: { $gte: new Date() }
    }).sort({ dueDate: 1 }).populate('project', 'title').lean();

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
        nextMilestone: nextTask?.title || null,
        nextTask: nextTask ? {
          id: nextTask._id,
          title: nextTask.title,
          dueDate: nextTask.dueDate,
          projectId: nextTask.project?._id || nextTask.project,
          projectTitle: nextTask.project?.title || ''
        } : null
      }
    });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load student dashboard data');
  }
};
