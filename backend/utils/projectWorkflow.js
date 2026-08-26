const ACTIVE_TASK_STATUSES = ['todo', 'in_progress', 'blocked', 'review'];
const COMPLETED_TASK_STATUSES = ['done', 'completed'];

const taskMetrics = (tasks = [], now = new Date()) => {
  const counted = tasks.filter((task) => task.status !== 'cancelled');
  const completed = counted.filter((task) => COMPLETED_TASK_STATUSES.includes(task.status)).length;
  const overdue = counted.filter((task) => task.dueDate && new Date(task.dueDate) < now && !COMPLETED_TASK_STATUSES.includes(task.status)).length;
  const blocked = counted.filter((task) => task.status === 'blocked').length;
  return {
    total: counted.length,
    completed,
    pending: counted.filter((task) => ACTIVE_TASK_STATUSES.includes(task.status)).length,
    overdue,
    blocked,
    progressPercentage: counted.length ? Math.round((completed / counted.length) * 100) : 0
  };
};

const projectHealth = ({ project, tasks = [], submissions = [], now = new Date() }) => {
  const metrics = taskMetrics(tasks, now);
  const reasons = [];
  if (!project?.supervisor) reasons.push('Primary supervisor is not assigned');
  if (project?.proposalState === 'revision_requested') reasons.push('Proposal revision is required');
  if (project?.proposalState === 'rejected') reasons.push('Proposal was rejected');
  if (metrics.blocked) reasons.push(`${metrics.blocked} blocked task${metrics.blocked === 1 ? '' : 's'}`);
  if (metrics.overdue) reasons.push(`${metrics.overdue} overdue task${metrics.overdue === 1 ? '' : 's'}`);
  const revisions = submissions.filter((submission) => submission.status === 'Needs Revision').length;
  if (revisions) reasons.push(`${revisions} deliverable revision${revisions === 1 ? '' : 's'} required`);
  const pendingReviews = submissions.filter((submission) => submission.status === 'Under Review').length;
  if (pendingReviews) reasons.push(`${pendingReviews} deliverable${pendingReviews === 1 ? '' : 's'} awaiting review`);

  let label = 'On Track';
  if (['completed', 'archived'].includes(project?.status)) label = 'Complete';
  else if (!project?.supervisor || ['rejected', 'revision_requested'].includes(project?.proposalState)) label = 'Setup Required';
  else if (metrics.overdue || metrics.blocked || revisions) label = 'At Risk';
  else if (!metrics.total) label = 'Planning';
  else if (pendingReviews) label = 'Needs Attention';

  return { label, reasons, ...metrics };
};

const projectCapabilities = (project, user) => {
  const userId = String(user?.id || user?._id || '');
  const leaderId = String(project?.leaderUserId?._id || project?.leaderUserId || project?.students?.[0]?._id || project?.students?.[0] || '');
  const supervisorId = String(project?.supervisor?._id || project?.supervisor || '');
  const isAdmin = user?.role === 'admin';
  const isLeader = Boolean(userId && userId === leaderId);
  const isSupervisor = Boolean(userId && userId === supervisorId);
  const isMember = project?.students?.some((student) => String(student?._id || student) === userId) || false;
  const active = project?.status === 'active';
  return {
    isAdmin,
    isLeader,
    isSupervisor,
    isMember,
    canManageRoster: isAdmin || isLeader || isSupervisor,
    canInviteStudents: isAdmin || isLeader || isSupervisor,
    canInviteSupervisor: !supervisorId && (isAdmin || isLeader),
    canAssignTasks: project?.status !== 'archived' && (isAdmin || isLeader || isSupervisor),
    canReview: active && (isAdmin || isSupervisor)
  };
};

module.exports = { taskMetrics, projectHealth, projectCapabilities, COMPLETED_TASK_STATUSES };
