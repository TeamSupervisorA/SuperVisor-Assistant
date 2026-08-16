/* Smoke test for the feature round: member management, report, team policy, upload, notifications */
process.env.NODE_ENV = 'test';
process.env.PORT = '5099';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-secret';
process.env.ALLOW_PUBLIC_SUPERVISOR_REGISTRATION = 'true';
process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = '30';
// Exercise the exact Paper Editor failure path without allowing a developer's
// local compiler configuration to make this smoke test reach a real service.
process.env.LATEX_COMPILER_URL = '';
process.env.LATEX_COMPILER_SHARED_SECRET = 'smoke-latex-compiler-secret-do-not-expose';
process.env.CODE_RUNNER_URL = '';
process.env.CODE_RUNNER_SHARED_SECRET = 'smoke-code-runner-secret-do-not-expose';

require('./server');
const User = require('./models/User');

const BASE = 'http://localhost:5099';
const runId = `${process.pid}-${Date.now()}`;
const emails = {
  alice: `alice-${runId}@test.com`,
  bob: `bob-${runId}@test.com`,
  eve: `eve-${runId}@test.com`,
  supervisor: `sup-${runId}@test.com`,
  inactive: `inactive-${runId}@test.com`,
  modern: `modern-${runId}@research.technology`,
  pending: `pending-${runId}@test.com`,
  unapproved: `unapproved-${runId}@test.com`
};
let passed = 0, failed = 0;
const check = (name, cond, extra = '') => {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name} ${extra}`); }
};

const api = async (path, { method = 'GET', token, body, raw } = {}) => {
  const headers = {};
  if (!raw) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: raw ? body : (body ? JSON.stringify(body) : undefined)
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
};

const run = async () => {
  await new Promise(r => setTimeout(r, 2500)); // wait for server + in-memory db

  const invalidJsonResponse = await fetch(`${BASE}/api/does-not-exist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{'
  });
  const invalidJson = await invalidJsonResponse.json();
  check('malformed JSON receives a safe API error response', invalidJsonResponse.status === 400 && invalidJson.error === 'Invalid JSON request body');
  const missingRoute = await api('/api/does-not-exist');
  check('unknown API routes return JSON rather than an HTML error page', missingRoute.status === 404 && missingRoute.data?.error === 'API endpoint not found');

  // ---- users
  const reg = async (name, email, role) => {
    const requested = await api('/api/auth/register/request-verification', {
      method: 'POST', body: { name, email, password: 'pass1234', role }
    });
    if (requested.status !== 202) {
      console.error(`Registration request failed for smoke user ${name}:`, requested.status, requested.data?.error);
      return requested.data;
    }
    const verified = await api('/api/auth/register/verify', {
      method: 'POST', body: { email, code: '000000' }
    });
    if (verified.status !== 201) console.error(`Registration verification failed for smoke user ${name}:`, verified.status, verified.data?.error);
    return verified.data;
  };
  const alice = await reg('Alice', emails.alice, 'student');
  const bob = await reg('Bob', emails.bob, 'student');
  const eve = await reg('Eve', emails.eve, 'student');
  const sup = await reg('Dr. Sup', emails.supervisor, 'supervisor');
  const modernDomain = await api('/api/auth/register/request-verification', { method: 'POST', body: { name: 'Modern Domain', email: emails.modern, password: 'pass1234' } });
  const modernDomainVerified = await api('/api/auth/register/verify', { method: 'POST', body: { email: emails.modern, code: '000000' } });
  check('registration accepts a valid modern top-level domain after email verification', modernDomain.status === 202 && modernDomainVerified.status === 201 && !!modernDomainVerified.data.token);
  const inactiveStudent = await reg('Inactive Student', emails.inactive, 'student');
  await User.findByIdAndUpdate(inactiveStudent.user.id, { status: 'inactive' });
  const duplicateRegistration = await api('/api/auth/register/request-verification', { method: 'POST', body: { name: 'Alice Again', email: emails.alice, password: 'pass1234' } });
  check('duplicate registration returns a safe sign-in message', duplicateRegistration.status === 409 && /account already exists/i.test(duplicateRegistration.data.error));
  const pendingSignup = await api('/api/auth/register/request-verification', { method: 'POST', body: { name: 'Pending User', email: emails.pending, password: 'pass1234' } });
  const pendingLogin = await api('/api/auth/login', { method: 'POST', body: { email: emails.pending, password: 'pass1234' } });
  const wrongVerification = await api('/api/auth/register/verify', { method: 'POST', body: { email: emails.pending, code: '111111' } });
  const pending = await User.findOne({ email: emails.pending });
  if (pending) await User.findByIdAndUpdate(pending._id, { emailVerificationLastSentAt: new Date(Date.now() - 31_000) });
  const pendingResend = await api('/api/auth/register/resend-verification', { method: 'POST', body: { email: emails.pending } });
  const verifiedPending = await api('/api/auth/register/verify', { method: 'POST', body: { email: emails.pending, code: '000000' } });
  check('email verification blocks login, rejects wrong codes, allows safe resend, and activates only after the correct code', pendingSignup.status === 202 && pendingLogin.status === 403 && wrongVerification.status === 400 && pendingResend.status === 200 && verifiedPending.status === 201 && !!verifiedPending.data.token);
  const googleNotConfigured = await api('/api/auth/google', { method: 'POST', body: { credential: 'not-a-real-token' } });
  check('Google sign-in does not accept credentials when the client ID is not configured', googleNotConfigured.status === 503 && !googleNotConfigured.data.token);
  const unknownReset = await api('/api/auth/forgot-password', { method: 'POST', body: { email: 'unknown@test.com' } });
  check('password reset does not reveal unknown accounts', unknownReset.status === 200 && /If an account exists/i.test(unknownReset.data.message));
  const invalidReset = await api('/api/auth/reset-password/not-a-valid-token', { method: 'POST', body: { password: 'pass1234' } });
  check('invalid reset token is rejected', invalidReset.status === 400);
  process.env.ALLOW_PUBLIC_SUPERVISOR_REGISTRATION = 'false';
  const unapprovedSupervisor = await reg('Unapproved Supervisor', emails.unapproved, 'supervisor');
  check('public supervisor registration is downgraded to student', unapprovedSupervisor.user.role === 'student');

  // ---- student proposal -> supervisor claim lifecycle and private discovery
  const unassignedProject = await api('/api/projects', { method: 'POST', token: alice.token, body: { title: 'Student Proposal', description: 'Awaiting a supervisor.' } });
  check('student project begins unassigned and proposed', unassignedProject.status === 201 && !unassignedProject.data.data.supervisor && unassignedProject.data.data.status === 'proposed');
  const unassignedId = unassignedProject.data.data._id;
  const outsiderExplore = await api('/api/projects/explore', { token: eve.token });
  check('students cannot discover unrelated projects', outsiderExplore.status === 200 && !(outsiderExplore.data.data || []).some(project => project._id === unassignedId));
  const supervisorExplore = await api('/api/projects/explore', { token: sup.token });
  check('supervisor can discover unassigned proposals without student email leakage', supervisorExplore.status === 200 && (supervisorExplore.data.data || []).some(project => project._id === unassignedId) && !JSON.stringify(supervisorExplore.data).includes(emails.alice));
  const claimed = await api(`/api/projects/${unassignedId}/claim`, { method: 'POST', token: sup.token });
  check('supervisor can claim an unassigned student proposal', claimed.status === 200 && claimed.data.data.supervisor?._id === sup.user.id);
  const claimedAgain = await api(`/api/projects/${unassignedId}/claim`, { method: 'POST', token: sup.token });
  check('supervisor claim is idempotent for the same supervisor', claimedAgain.status === 200 && claimedAgain.data.data.supervisor?._id === sup.user.id);

  // ---- supervisor creates a project and assigns its first student
  const proj = await api('/api/projects', { method: 'POST', token: sup.token, body: { title: 'Smoke Project', description: 'x', students: [alice.user.id] } });
  check('supervisor creates an active project workspace', proj.status === 201 && proj.data.data.status === 'active' && proj.data.data.supervisor === sup.user.id);
  const pid = proj.data.data._id;

  const membershipPatch = await api(`/api/projects/${pid}`, { method: 'PUT', token: sup.token, body: { students: [eve.user.id] } });
  check('general project update cannot alter team membership', membershipPatch.status === 422);

  const aiStatus = await api('/api/ai/status', { token: alice.token });
  check('AI status is authenticated, reports the configured/default model, and does not expose secrets', aiStatus.status === 200 && aiStatus.data.data.model === (process.env.GEMINI_MODEL || 'gemini-3.6-flash') && typeof aiStatus.data.data.configured === 'boolean' && !JSON.stringify(aiStatus.data).includes(process.env.GEMINI_API_KEY || '__no_key__'));
  const invalidOutline = await api('/api/ai/proposal-outline', { method: 'POST', token: alice.token, body: {} });
  check('proposal outline validates its topic without calling the provider', invalidOutline.status === 422);
  const outsiderReportDraft = await api(`/api/ai/projects/${pid}/report-draft`, { method: 'POST', token: eve.token });
  check('outsider cannot generate a project report narrative (403)', outsiderReportDraft.status === 403);

  // ---- member management
  const studentAdd = await api(`/api/projects/${pid}/members`, { method: 'POST', token: alice.token, body: { email: emails.bob } });
  check('student cannot change a supervised project roster', studentAdd.status === 403);

  const add = await api(`/api/projects/${pid}/members`, { method: 'POST', token: sup.token, body: { email: emails.bob } });
  check('assigned supervisor adds teammate by email', add.status === 200 && add.data.data.students.length === 2);

  const inactiveAdd = await api(`/api/projects/${pid}/members`, { method: 'POST', token: sup.token, body: { email: emails.inactive } });
  check('inactive students cannot be added to an active project team', inactiveAdd.status === 400 && /active student/i.test(inactiveAdd.data.error));

  const dup = await api(`/api/projects/${pid}/members`, { method: 'POST', token: sup.token, body: { email: emails.bob } });
  check('duplicate member rejected', dup.status === 400);

  const evil = await api(`/api/projects/${pid}/members`, { method: 'POST', token: eve.token, body: { email: emails.eve } });
  check('outsider cannot add members (403)', evil.status === 403);

  const supAdd = await api(`/api/projects/${pid}/members`, { method: 'POST', token: sup.token, body: { email: emails.supervisor } });
  check('supervisor account rejected as member', supAdd.status === 400);

  // Bob got a notification
  const bobNotifs = await api('/api/notifications', { token: bob.token });
  check('teammate received notification', bobNotifs.status === 200 && (bobNotifs.data.data || []).some(n => n.title.includes('Added to a project team')), JSON.stringify(bobNotifs.data).slice(0, 120));
  const markBobNotifications = await api('/api/notifications/read-all', { method: 'PUT', token: bob.token });
  const bobReadNotifs = await api('/api/notifications', { token: bob.token });
  check('mark all notifications is stored for the current user', markBobNotifications.status === 200 && (bobReadNotifs.data.data || []).every(notification => notification.isRead));

  // ---- report
  const rep = await api(`/api/projects/${pid}/report`, { token: alice.token });
  check('member can fetch report', rep.status === 200 && rep.data.data.projectTitle === 'Smoke Project');
  check('report has summary/progress/health', typeof rep.data.data.summary === 'string' && typeof rep.data.data.progressPercentage === 'number' && !!rep.data.data.health);

  const repEve = await api(`/api/projects/${pid}/report`, { token: eve.token });
  check('outsider cannot fetch report (403)', repEve.status === 403);

  // ---- project-scoped research workspace
  const anonymousRuntimeStatus = await api('/api/workspace/runtime-status');
  check('workspace capability details require authentication and never expose runtime secrets', anonymousRuntimeStatus.status === 401 && !JSON.stringify(anonymousRuntimeStatus.data).includes(process.env.LATEX_COMPILER_SHARED_SECRET) && !JSON.stringify(anonymousRuntimeStatus.data).includes(process.env.CODE_RUNNER_SHARED_SECRET));
  const runtimeStatus = await api('/api/workspace/runtime-status', { token: alice.token });
  check('workspace reports safe runtime capabilities without service URLs or secrets', runtimeStatus.status === 200 && runtimeStatus.data.data.compiler.state === 'not_configured' && runtimeStatus.data.data.codeRunner.state === 'not_configured' && Array.isArray(runtimeStatus.data.data.compiler.engines) && Array.isArray(runtimeStatus.data.data.codeRunner.languages) && !JSON.stringify(runtimeStatus.data).includes('CODE_RUNNER_URL') && !JSON.stringify(runtimeStatus.data).includes(process.env.LATEX_COMPILER_SHARED_SECRET) && !JSON.stringify(runtimeStatus.data).includes(process.env.CODE_RUNNER_SHARED_SECRET));
  const workspaceCreate = await api(`/api/workspace/projects/${pid}/documents`, {
    method: 'POST', token: alice.token,
    body: { title: 'Thesis Draft', kind: 'paper', language: 'latex', content: '\\section{Introduction}\nResearch draft.' }
  });
  check('member creates a project-scoped paper draft', workspaceCreate.status === 201 && workspaceCreate.data.data.kind === 'paper');
  const externalOverleaf = await api(`/api/workspace/projects/${pid}/documents`, {
    method: 'POST', token: alice.token,
    body: { title: 'Unsafe handoff', kind: 'paper', language: 'latex', content: 'x', overleafUrl: 'https://example.com/project/unsafe' }
  });
  check('workspace rejects non-Overleaf handoff URLs', externalOverleaf.status === 422);
  const workspaceId = workspaceCreate.data.data._id;
  const unconfiguredCompile = await api(`/api/workspace/documents/${workspaceId}/compile`, { method: 'POST', token: alice.token, body: { engine: 'pdflatex' } });
  check('unconfigured LaTeX compiler fails safely with a setup code', unconfiguredCompile.status === 503 && unconfiguredCompile.data.code === 'LATEX_COMPILER_NOT_CONFIGURED');
  const workspaceList = await api(`/api/workspace/projects/${pid}/documents`, { token: bob.token });
  check('teammate can list workspace documents', workspaceList.status === 200 && workspaceList.data.data.some(d => d._id === workspaceId));
  const workspaceUpdate = await api(`/api/workspace/documents/${workspaceId}`, { method: 'PUT', token: bob.token, body: { content: '\\section{Introduction}\nUpdated collaboratively.' } });
  check('teammate can update workspace document', workspaceUpdate.status === 200 && workspaceUpdate.data.data.content.includes('Updated collaboratively'));
  const workspaceEve = await api(`/api/workspace/documents/${workspaceId}`, { token: eve.token });
  check('outsider cannot view workspace document (403)', workspaceEve.status === 403);
  const codeWorkspace = await api(`/api/workspace/projects/${pid}/documents`, {
    method: 'POST', token: alice.token,
    body: { title: 'Safe Python experiment', kind: 'code', language: 'python', content: 'print("hello")' }
  });
  check('member creates an approved-language code workspace', codeWorkspace.status === 201 && codeWorkspace.data.data.language === 'python');
  if (!runtimeStatus.data.data.codeRunner.configured) {
    const unavailableRunner = await api(`/api/workspace/documents/${codeWorkspace.data.data._id}/run`, { method: 'POST', token: alice.token });
    check('unconfigured code runner fails safely with a setup code without executing code on the API', unavailableRunner.status === 503 && unavailableRunner.data.code === 'CODE_RUNNER_NOT_CONFIGURED');
  }
  const badResearchSearch = await api('/api/research/search?q=x', { token: alice.token });
  check('research search validates short queries', badResearchSearch.status === 422);
  const researchSearch = await api('/api/research/search?q=machine%20learning', { token: alice.token });
  check('research search returns scholarly metadata', researchSearch.status === 200 && researchSearch.data.data.length > 0 && researchSearch.data.data.every(work => work.title && work.source), JSON.stringify(researchSearch.data).slice(0, 160));

  // ---- immutable proposal lifecycle
  const proposalDraft = await api(`/api/projects/${pid}/proposals`, { method: 'POST', token: alice.token, body: { title: 'Smoke Proposal', content: 'A versioned proposal for the smoke test.' } });
  check('student creates proposal draft', proposalDraft.status === 201 && proposalDraft.data?.data?.versionNo === 1 && proposalDraft.data?.data?.state === 'draft', JSON.stringify(proposalDraft.data));
  if (proposalDraft.status !== 201) throw new Error(`Proposal draft failed: ${JSON.stringify(proposalDraft.data)}`);

  const proposalSubmit = await api(`/api/proposals/${proposalDraft.data.data._id}/submit`, { method: 'POST', token: alice.token });
  check('student submits immutable proposal version', proposalSubmit.status === 200 && proposalSubmit.data.data.state === 'submitted');

  const proposalEve = await api(`/api/projects/${pid}/proposals`, { token: eve.token });
  check('outsider cannot view proposal versions (403)', proposalEve.status === 403);

  const review = await api('/api/reviews', { method: 'POST', token: sup.token, body: { proposalVersion: proposalDraft.data.data._id, state: 'submitted', overallComment: 'Clarify the proposed method.', findings: [{ section: 'Methodology', severity: 'medium', explanation: 'Sampling strategy is incomplete.', recommendation: 'State the sample frame.' }] } });
  check('assigned supervisor creates a server-owned draft review', review.status === 201 && review.data.data.proposalVersion === proposalDraft.data.data._id && review.data.data.state === 'draft');
  const reviewSubmit = await api(`/api/reviews/${review.data.data._id}/submit`, { method: 'POST', token: sup.token });
  check('supervisor submits review', reviewSubmit.status === 200 && reviewSubmit.data.data.state === 'submitted');
  const proposalDecision = await api(`/api/proposals/${proposalDraft.data.data._id}/decision`, { method: 'POST', token: sup.token, body: { decision: 'approved', comment: 'Approved after review.' } });
  const approvedProject = await api(`/api/projects/${pid}`, { token: alice.token });
  check('approved proposal activates the project', proposalDecision.status === 200 && proposalDecision.data.data.state === 'approved' && approvedProject.data.data.status === 'active');

  // ---- immutable weekly progress log
  const progress = await api(`/api/projects/${pid}/progress-logs`, { method: 'POST', token: alice.token, body: { weekStart: '2026-07-20', summary: 'Completed initial research.', state: 'submitted', submittedAt: '2020-01-01' } });
  check('student creates a server-owned draft progress log', progress.status === 201 && progress.data.data.state === 'draft' && !progress.data.data.submittedAt);
  const supervisorProgress = await api(`/api/projects/${pid}/progress-logs`, { method: 'POST', token: sup.token, body: { weekStart: '2026-07-20', summary: 'Forged student update' } });
  check('supervisor cannot impersonate a student progress update', supervisorProgress.status === 403);
  const progressSubmit = await api(`/api/progress-logs/${progress.data.data._id}/submit`, { method: 'POST', token: alice.token });
  check('student submits progress log', progressSubmit.status === 200 && progressSubmit.data.data.state === 'submitted');
  const progressEdit = await api(`/api/progress-logs/${progress.data.data._id}`, { method: 'PUT', token: alice.token, body: { summary: 'Attempted silent edit.' } });
  check('submitted progress log is immutable', progressEdit.status === 409);

  const savedReport = await api(`/api/projects/${pid}/reports`, { method: 'POST', token: alice.token, body: { type: 'progress' } });
  check('member creates a versioned report snapshot', savedReport.status === 201 && savedReport.data.data.status === 'ready' && savedReport.data.data.version === 1);
  const savedReports = await api(`/api/projects/${pid}/reports`, { token: alice.token });
  check('member retrieves report history', savedReports.status === 200 && savedReports.data.data.length === 1 && savedReports.data.data[0].snapshot.tasks);
  const savedReportsEve = await api(`/api/projects/${pid}/reports`, { token: eve.token });
  check('outsider cannot view report history (403)', savedReportsEve.status === 403);

  // ---- delay detection reflected in report
  await api('/api/tasks', { method: 'POST', token: alice.token, body: { title: 'Overdue Task', project: pid, dueDate: '2020-01-01' } });
  const studentAssignedTask = await api('/api/tasks', { method: 'POST', token: alice.token, body: { title: 'Cannot assign others', project: pid, assignedTo: bob.user.id } });
  check('student-created tasks stay assigned to the student', studentAssignedTask.status === 201 && studentAssignedTask.data.data.assignedTo === alice.user.id);
  const forgedDoneTask = await api('/api/tasks', { method: 'POST', token: alice.token, body: { title: 'Done Task', project: pid, status: 'completed' } });
  check('new tasks cannot be client-created as completed', forgedDoneTask.status === 201 && forgedDoneTask.data.data.status === 'todo');
  const teammateProjectTasks = await api(`/api/tasks?project=${pid}`, { token: bob.token });
  const teammatePersonalTasks = await api('/api/tasks', { token: bob.token });
  check('team members can read shared task dependencies while personal task lists stay scoped', teammateProjectTasks.status === 200 && teammateProjectTasks.data.data.some(task => task._id === studentAssignedTask.data.data._id) && teammatePersonalTasks.status === 200 && !(teammatePersonalTasks.data.data || []).some(task => task._id === studentAssignedTask.data.data._id));
  const rep2 = await api(`/api/projects/${pid}/report`, { token: alice.token });
  const ts = rep2.data.data.taskSummary;
  check('report detects delayed task without forged completion progress', ts.delayed === 1 && ts.completed === 0 && rep2.data.data.progressPercentage === 0, JSON.stringify(ts));
  const invalidAssignee = await api('/api/tasks', { method: 'POST', token: sup.token, body: { title: 'Outside assignee', project: pid, assignedTo: eve.user.id } });
  check('supervisor cannot assign a project task to an outsider', invalidAssignee.status === 422);

  // ---- task lifecycle and dependency enforcement
  const prerequisite = await api('/api/tasks', { method: 'POST', token: alice.token, body: { title: 'Complete evidence review', project: pid, acceptanceCriteria: 'Evidence notes are verified.' } });
  const dependent = await api('/api/tasks', { method: 'POST', token: alice.token, body: { title: 'Draft findings', project: pid, acceptanceCriteria: 'A findings draft is ready for review.', dependencies: [prerequisite.data.data._id] } });
  const earlyStart = await api(`/api/tasks/${dependent.data.data._id}/transition`, { method: 'POST', token: alice.token, body: { status: 'in_progress' } });
  check('dependencies prevent premature task start', earlyStart.status === 422);
  const prerequisiteStart = await api(`/api/tasks/${prerequisite.data.data._id}/transition`, { method: 'POST', token: alice.token, body: { status: 'in_progress' } });
  const prerequisiteDone = await api(`/api/tasks/${prerequisite.data.data._id}/transition`, { method: 'POST', token: alice.token, body: { status: 'done' } });
  check('task can progress through its valid lifecycle', prerequisiteStart.status === 200 && prerequisiteDone.status === 200);
  const dependentStart = await api(`/api/tasks/${dependent.data.data._id}/transition`, { method: 'POST', token: alice.token, body: { status: 'in_progress' } });
  const dependentReview = await api(`/api/tasks/${dependent.data.data._id}/transition`, { method: 'POST', token: alice.token, body: { status: 'review' } });
  const studentAccept = await api(`/api/tasks/${dependent.data.data._id}/transition`, { method: 'POST', token: alice.token, body: { status: 'done' } });
  const supervisorAccept = await api(`/api/tasks/${dependent.data.data._id}/transition`, { method: 'POST', token: sup.token, body: { status: 'done' } });
  check('review tasks require supervisor acceptance', dependentStart.status === 200 && dependentReview.status === 200 && studentAccept.status === 403 && supervisorAccept.status === 200);

  // ---- team policy
  const team = await api('/api/teams', { method: 'POST', token: alice.token, body: { name: 'Smoke Team', project: pid, members: [{ user: bob.user.id, role: 'Developer' }] } });
  check('student creates team for own project', team.status === 201 && team.data.data.members[0].role === 'Leader');

  const nominateLeader = await api(`/api/teams/${team.data.data._id}/leader/nominate`, { method: 'POST', token: alice.token, body: { userId: bob.user.id } });
  check('team member nominates eligible leader', nominateLeader.status === 200 && nominateLeader.data.data.pendingLeader === bob.user.id);
  const confirmLeader = await api(`/api/teams/${team.data.data._id}/leader/confirm`, { method: 'POST', token: sup.token, body: { reason: 'Bob will coordinate implementation.' } });
  check('assigned supervisor confirms leader with one active leader', confirmLeader.status === 200 && confirmLeader.data.data.activeLeader === bob.user.id && confirmLeader.data.data.members.filter(m => m.role === 'Leader').length === 1);

  const teamEve = await api('/api/teams', { method: 'POST', token: eve.token, body: { name: 'Evil Team', project: pid } });
  check('outsider cannot create team for project (403)', teamEve.status === 403);

  const teamUpd = await api(`/api/teams/${team.data.data._id}`, { method: 'PUT', token: eve.token, body: { name: 'Hacked' } });
  check('non-leader cannot update team (403)', teamUpd.status === 403);

  // ---- evaluation ownership and score integrity
  const evaluation = await api('/api/evaluations', { method: 'POST', token: sup.token, body: {
    project: pid,
    scores: { problemUnderstanding: '10', methodology: '20', implementation: '30', documentation: '40' },
    feedback: 'Strong baseline submission.'
  } });
  check('supervisor evaluation normalizes numeric rubric scores', evaluation.status === 201 && evaluation.data.data.totalScore === 100);
  const outsiderEvaluations = await api(`/api/evaluations?project=${pid}`, { token: eve.token });
  check('student cannot read evaluations for an unrelated project', outsiderEvaluations.status === 403);
  const evaluationMassAssignment = await api(`/api/evaluations/${evaluation.data.data._id}`, { method: 'PUT', token: sup.token, body: {
    project: unassignedId,
    evaluator: eve.user.id,
    totalScore: 999,
    scores: { documentation: '30' }
  } });
  check('evaluation update cannot move ownership or forge total score', evaluationMassAssignment.status === 200 && evaluationMassAssignment.data.data.project === pid && evaluationMassAssignment.data.data.evaluator === sup.user.id && evaluationMassAssignment.data.data.totalScore === 90);

  const oversizedChat = await api('/api/messages', { method: 'POST', token: alice.token, body: { project: pid, content: 'x'.repeat(5001) } });
  check('project chat rejects oversized messages', oversizedChat.status === 422);

  // ---- upload from device (multipart)
  const fd = new FormData();
  fd.append('file', new Blob(['hello smoke'], { type: 'text/plain' }), 'smoke.txt');
  const upRes = await fetch(`${BASE}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${alice.token}` }, body: fd });
  const upData = await upRes.json();
  check('file upload normalizes the extension', upRes.status === 200 && upData.data.fileUrl.endsWith('.txt'), JSON.stringify(upData).slice(0, 120));

  const fileFetch = await fetch(`${BASE}${upData.data.fileUrl}`);
  check('uploaded file is served statically', fileFetch.status === 200 && (await fileFetch.text()) === 'hello smoke');

  process.env.VERCEL = '1';
  const productionUpload = await fetch(`${BASE}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${alice.token}` }, body: fd });
  check('cloud-local upload is blocked until private object storage is configured', productionUpload.status === 503);
  delete process.env.VERCEL;

  // ---- submission + grading notifications
  const textOnly = await api('/api/submissions', { method: 'POST', token: alice.token, body: { title: 'Text-only reflection', project: pid, content: 'This text-only submission remains usable when production object storage is not configured.' } });
  check('student can submit text without a local production upload', textOnly.status === 201 && !textOnly.data.data.fileUrl && textOnly.data.data.content.length > 0);
  const supervisorSubmission = await api('/api/submissions', { method: 'POST', token: sup.token, body: { title: 'Forged', project: pid, content: 'This must be rejected because only students submit deliverables.' } });
  check('supervisor cannot impersonate a student submission', supervisorSubmission.status === 403);
  const sub = await api('/api/submissions', { method: 'POST', token: alice.token, body: { title: 'Draft 1', project: pid, fileUrl: upData.data.fileUrl, content: 'This is a sufficiently detailed research submission text used to preserve the original work for an integrity screen. It describes the study design, evaluation criteria, ethical safeguards, and limitations without asserting that any automated screen is a plagiarism verdict.', status: 'Graded', grade: 'A+', student: eve.user.id } });
  check('submission created with uploaded file and text', sub.status === 201 && sub.data.data.content.length >= 200);
  check('student cannot pre-grade or impersonate a submission', sub.data.data.status === 'Submitted' && !sub.data.data.grade && sub.data.data.student === alice.user.id);

  const grade = await api(`/api/submissions/${sub.data.data._id}`, { method: 'PUT', token: sup.token, body: { grade: 'A', feedback: 'Nice work', status: 'Graded' } });
  check('supervisor grades submission', grade.status === 200 && grade.data.data.grade === 'A');
  const gradedEdit = await api(`/api/submissions/${sub.data.data._id}`, { method: 'PUT', token: alice.token, body: { content: 'Attempted post-grade replacement.' } });
  check('student cannot edit a graded submission', gradedEdit.status === 409);

  const aliceNotifs = await api('/api/notifications', { token: alice.token });
  check('student notified of feedback', (aliceNotifs.data.data || []).some(n => n.title === 'Feedback received'));

  const protectedDeletion = await api(`/api/projects/${pid}`, { method: 'DELETE', token: sup.token });
  check('project with academic records cannot be deleted and orphan data', protectedDeletion.status === 409);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
};

run().catch(e => { console.error('Smoke run crashed:', e); process.exit(1); });
