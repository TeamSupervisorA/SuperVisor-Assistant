const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Meeting = require('../models/Meeting');
const PlagiarismReport = require('../models/PlagiarismReport');
const { sendServerError } = require('../utils/errorResponse');
const { taskMetrics } = require('../utils/projectWorkflow');

exports.getAdminMetrics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'supervisor' });
    const activeProjects = await Project.countDocuments({ status: { $in: ['draft', 'awaiting_supervisor', 'awaiting_approval', 'proposed', 'active'] } });
    
    // Real counts from submissions and plagiarism reports
    const assignmentsSubmitted = await Submission.countDocuments();
    const plagiarismAlerts = await PlagiarismReport.countDocuments({
      status: 'Completed',
      isCurrent: { $ne: false },
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
    const pendingInvitations = await Project.find({
      supervisor: null,
      supervisorInvitations: { $elemMatch: { supervisor: supervisorId, state: 'pending' } }
    })
      .select('_id title department section status proposalState students leaderUserId supervisorInvitations')
      .populate('students', 'name department')
      .populate('leaderUserId', 'name')
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
    const integrityReviewThreshold = Number.isFinite(req.user.settings?.plagiarismTolerance)
      ? req.user.settings.plagiarismTolerance
      : 20;
    const plagiarismAlerts = await PlagiarismReport.countDocuments({
      project: { $in: projectIds },
      status: 'Completed',
      isCurrent: { $ne: false },
      overallSimilarity: { $gt: integrityReviewThreshold }
    });

    const projectHealth = await Promise.all(supervisedProjects.map(async (project) => {
      const [tasks, pendingSubmissions] = await Promise.all([
        Task.find({ project: project._id }).select('status dueDate').lean(),
        Submission.countDocuments({ project: project._id, status: { $in: ['Submitted', 'Under Review', 'Needs Revision'] } })
      ]);
      const metrics = taskMetrics(tasks);
      return {
        projectId: project._id,
        title: project.title,
        status: project.status,
        studentCount: project.students?.length || 0,
        totalTasks: metrics.total,
        completedTasks: metrics.completed,
        delayedTasks: metrics.overdue,
        blockedTasks: metrics.blocked,
        pendingSubmissions,
        progress: metrics.progressPercentage
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
        pendingInvitations,
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
    const now = new Date();

    const studentProjects = await Project.find({
      students: studentId,
      status: { $in: ['draft', 'awaiting_supervisor', 'awaiting_approval', 'proposed', 'active'] }
    }).select('_id title status supervisor proposalState').lean();
    const activeProjects = studentProjects.length;
    const projectIds = studentProjects.map((project) => project._id);

    // Count tasks
    const totalTasks = await Task.countDocuments({ assignedTo: studentId, status: { $ne: 'cancelled' } });
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
      dueDate: { $gte: now }
    }).sort({ dueDate: 1 }).populate('project', 'title').lean();

    const [blockedTask, overdueTask, revisionSubmission, currentTask, upcomingMeeting] = await Promise.all([
      Task.findOne({ assignedTo: studentId, status: 'blocked' }).sort({ dueDate: 1 }).populate('project', 'title').lean(),
      Task.findOne({ assignedTo: studentId, status: { $nin: ['done', 'completed', 'cancelled'] }, dueDate: { $lt: now } }).sort({ dueDate: 1 }).populate('project', 'title').lean(),
      Submission.findOne({ student: studentId, status: 'Needs Revision' }).sort({ submittedAt: -1 }).populate('project', 'title').lean(),
      Task.findOne({ assignedTo: studentId, status: { $in: ['in_progress', 'todo'] } }).sort({ dueDate: 1 }).populate('project', 'title').lean(),
      Meeting.findOne({ project: { $in: projectIds }, status: 'Upcoming', date: { $gte: now } }).sort({ date: 1 }).populate('project', 'title').lean()
    ]);

    const missingSupervisor = studentProjects.find((project) => !project.supervisor);
    const nextAction = blockedTask ? {
      type: 'blocked_task', title: `Resolve blocker: ${blockedTask.title}`, detail: blockedTask.blockedReason || 'This task needs clarification or support.', path: '/tasks-milestones', projectId: blockedTask.project?._id || blockedTask.project
    } : overdueTask ? {
      type: 'overdue_task', title: `Overdue: ${overdueTask.title}`, detail: `Due ${new Date(overdueTask.dueDate).toLocaleDateString()}`, path: '/tasks-milestones', projectId: overdueTask.project?._id || overdueTask.project
    } : revisionSubmission ? {
      type: 'revision', title: `Revise ${revisionSubmission.title}`, detail: revisionSubmission.feedback || 'Your supervisor requested a new deliverable revision.', path: '/student-submissions', projectId: revisionSubmission.project?._id || revisionSubmission.project
    } : missingSupervisor ? {
      type: 'supervisor', title: 'Connect a project supervisor', detail: `${missingSupervisor.title} cannot enter its full review workflow until a supervisor accepts.`, path: '/team-management', projectId: missingSupervisor._id
    } : currentTask ? {
      type: 'task', title: currentTask.title, detail: currentTask.status === 'todo' ? 'This planned task is ready to start.' : 'Continue the current task and attach evidence when requesting review.', path: '/tasks-milestones', projectId: currentTask.project?._id || currentTask.project
    } : upcomingMeeting ? {
      type: 'meeting', title: upcomingMeeting.title, detail: `Scheduled ${new Date(upcomingMeeting.date).toLocaleDateString()} at ${upcomingMeeting.time}`, path: '/meeting-management', projectId: upcomingMeeting.project?._id || upcomingMeeting.project
    } : studentProjects[0] ? {
      type: 'create_task', title: 'Plan the first task or milestone', detail: 'Define an owner, evidence-based outcome, and due date.', path: '/tasks-milestones', projectId: studentProjects[0]._id
    } : {
      type: 'create_project', title: 'Create your first project', detail: 'Start with a project and Proposal Version 1.', path: '/create-new-work', projectId: null
    };

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
        } : null,
        nextAction
      }
    });
  } catch (error) {
    return sendServerError(res, error, 'Unable to load student dashboard data');
  }
};
