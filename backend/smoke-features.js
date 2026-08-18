/* Smoke test for the feature round: member management, report, team policy, upload, notifications */
process.env.NODE_ENV = 'test';
process.env.PORT = '5099';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-secret';
process.env.ALLOW_PUBLIC_SUPERVISOR_REGISTRATION = 'true';
process.env.EMAIL_VERIFICATION_ENABLED = 'true';
process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = '30';
// Exercise the exact Paper Editor failure path without allowing a developer's
// local compiler configuration to make this smoke test reach a real service.
process.env.LATEX_COMPILER_URL = '';
process.env.LATEX_COMPILER_SHARED_SECRET = 'smoke-latex-compiler-secret-do-not-expose';
process.env.CODE_RUNNER_URL = '';
process.env.CODE_RUNNER_SHARED_SECRET = 'smoke-code-runner-secret-do-not-expose';

require('./server');
const User = require('./models/User');
const ProposalVersion = require('./models/ProposalVersion');
const Institution = require('./models/Institution');
const Project = require('./models/Project');
const jwt = require('jsonwebtoken');

const BASE = 'http://localhost:5099';
const runId = `${process.pid}-${Date.now()}`;
const emails = {
  alice: `alice-${runId}@test.com`,
  bob: `bob-${runId}@test.com`,
  eve: `eve-${runId}@test.com`,
  supervisor: `sup-${runId}@test.com`,
  supervisorTwo: `sup-two-${runId}@test.com`,
  admin: `admin-${runId}@test.com`,
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
  const supTwo = await reg('Dr. Guide', emails.supervisorTwo, 'supervisor');
  const adminUser = await User.create({ name: 'Academic Admin', email: emails.admin, password: 'pass1234', role: 'admin', emailVerified: true, onboardingStatus: 'complete' });
  const admin = { token: jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' }), user: { id: String(adminUser._id) } };
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
  process.env.EMAIL_VERIFICATION_ENABLED = 'false';
  const directRegistration = await api('/api/auth/register/request-verification', {
    method: 'POST', body: { name: 'Direct Registration', email: `direct-${runId}@test.com`, password: 'pass1234', role: 'student' }
  });
  check('registration issues a session without an email code while verification is disabled', directRegistration.status === 201 && !!directRegistration.data?.token && directRegistration.data?.user?.role === 'student');
  process.env.EMAIL_VERIFICATION_ENABLED = 'true';
  const directSignupRoute = await api('/api/auth/register', {
    method: 'POST', body: { name: 'Sign Up Route', email: `signup-${runId}@test.com`, password: 'pass1234', role: 'student' }
  });
  check('the current sign-up route never redirects into email-code verification', directSignupRoute.status === 201 && !!directSignupRoute.data?.token && directSignupRoute.data?.user?.role === 'student');
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
  check('student project begins with a leader, Proposal Version 1, and no supervisor', unassignedProject.status === 201 && !unassignedProject.data.data.supervisor && unassignedProject.data.data.status === 'awaiting_supervisor' && String(unassignedProject.data.data.leaderUserId?._id || unassignedProject.data.data.leaderUserId) === alice.user.id && await ProposalVersion.countDocuments({ project: unassignedProject.data.data._id, versionNo: 1 }) === 1);
  const unassignedId = unassignedProject.data.data._id;
  const outsiderExplore = await api('/api/projects/explore', { token: eve.token });
  check('students cannot discover unrelated projects', outsiderExplore.status === 200 && !(outsiderExplore.data.data || []).some(project => project._id === unassignedId));
  const supervisorExplore = await api('/api/projects/explore', { token: sup.token });
  check('supervisors see only assigned projects rather than browsing private proposals', supervisorExplore.status === 200 && !(supervisorExplore.data.data || []).some(project => project._id === unassignedId) && !JSON.stringify(supervisorExplore.data).includes(emails.alice));
  const claimed = await api(`/api/projects/${unassignedId}/claim`, { method: 'POST', token: sup.token });
  check('supervisor cannot self-claim an uninvited proposal', claimed.status === 403);
  const claimedAgain = await api(`/api/projects/${unassignedId}/claim`, { method: 'POST', token: sup.token });
  check('repeated unauthorized claims remain blocked', claimedAgain.status === 403);
  const pendingTask = await api('/api/tasks', { method: 'POST', token: alice.token, body: { title: 'Premature task', project: unassignedId, acceptanceCriteria: 'Must not be created.' } });
  const pendingSubmission = await api('/api/submissions', { method: 'POST', token: alice.token, body: { title: 'Premature deliverable', project: unassignedId, content: 'Must not be submitted.' } });
  const pendingMeeting = await api('/api/meetings', { method: 'POST', token: alice.token, body: { project: unassignedId, title: 'Premature meeting', date: '2026-09-01', time: '10:00', agenda: 'Must not be scheduled.' } });
  const pendingChat = await api('/api/messages', { method: 'POST', token: alice.token, body: { project: unassignedId, content: 'Must not be posted.' } });
  const pendingHealth = await api(`/api/projects/${unassignedId}/report`, { token: alice.token });
  check('pending projects allow setup but block active-work mutations (except tasks, meetings and chat)', pendingTask.status === 201 && pendingSubmission.status === 409 && pendingMeeting.status === 201 && pendingChat.status === 201);
  check('project health reports missing supervision honestly', pendingHealth.status === 200 && pendingHealth.data.data.health === 'Setup Required' && pendingHealth.data.data.healthReasons.some((reason) => /supervisor/i.test(reason)));

  // ---- supervisor creates a project, assigns its first student, and follows approval
  const proj = await api('/api/projects', { method: 'POST', token: sup.token, body: { title: 'Smoke Project', description: 'x', students: [alice.user.id] } });
  const supervisorProjectProposal = await ProposalVersion.findOne({ project: proj.data.data._id, versionNo: 1 });
  check('supervisor-created project still requires student-owned proposal approval', proj.status === 201 && proj.data.data.status === 'awaiting_approval' && String(proj.data.data.supervisor?._id || proj.data.data.supervisor) === sup.user.id && supervisorProjectProposal?.createdBy?.toString() === alice.user.id);
  const pid = proj.data.data._id;
  const supervisorProjectProposalSubmit = await api(`/api/proposals/${supervisorProjectProposal._id}/submit`, { method: 'POST', token: alice.token });
  const supervisorProjectProposalDecision = await api(`/api/proposals/${supervisorProjectProposal._id}/decision`, { method: 'POST', token: sup.token, body: { decision: 'approved', comment: 'Approved for active work.' } });
  const activeSupervisorProject = await api(`/api/projects/${pid}`, { token: alice.token });
  check('proposal approval is the single path that activates connected work', supervisorProjectProposalSubmit.status === 200 && supervisorProjectProposalDecision.status === 200 && activeSupervisorProject.data.data.status === 'active');

  const membershipPatch = await api(`/api/projects/${pid}`, { method: 'PUT', token: sup.token, body: { students: [eve.user.id] } });
  check('general project update cannot alter team membership', membershipPatch.status === 422);

  const aiStatus = await api('/api/ai/status', { token: alice.token });
  check('AI status is authenticated, reports the configured/default model, and does not expose secrets', aiStatus.status === 200 && aiStatus.data.data.model === (process.env.GEMINI_MODEL || 'gemini-3.6-flash') && typeof aiStatus.data.data.configured === 'boolean' && !JSON.stringify(aiStatus.data).includes(process.env.GEMINI_API_KEY || '__no_key__'));
  const invalidOutline = await api('/api/ai/proposal-outline', { method: 'POST', token: alice.token, body: {} });
  check('proposal outline validates its topic without calling the provider', invalidOutline.status === 422);
  const outsiderReportDraft = await api(`/api/ai/projects/${pid}/report-draft`, { method: 'POST', token: eve.token });
  check('outsider cannot generate a project report narrative (403)', outsiderReportDraft.status === 403);
  const emptyAssistant = await api('/api/ai/assistant', { method: 'POST', token: alice.token, body: { project: pid, message: '' } });
  check('role-aware assistant validates an empty message without calling the provider', emptyAssistant.status === 422);
  const outsiderAssistant = await api('/api/ai/assistant', { method: 'POST', token: eve.token, body: { project: pid, message: 'What should I do next?', mode: 'planning' } });
  check('role-aware assistant cannot read an outsider project context', outsiderAssistant.status === 403);

  // ---- member management
  const studentAdd = await api(`/api/projects/${pid}/members`, { method: 'POST', token: alice.token, body: { email: emails.bob } });
  check('project leader invites a student without silently adding them', studentAdd.status === 200 && studentAdd.data.data.students.length === 1 && studentAdd.data.data.memberInvitations.some((item) => item.email === emails.bob && item.state === 'pending'));
  const memberInvitationId = studentAdd.data.data.memberInvitations.find((item) => item.email === emails.bob && item.state === 'pending')._id;
  const add = await api(`/api/projects/${pid}/members/${memberInvitationId}/respond`, { method: 'POST', token: bob.token, body: { decision: 'accept' } });
  check('invited student accepts and joins the canonical project roster', add.status === 200 && add.data.data.students.length === 2);

  const milestone = await api(`/api/projects/${pid}/milestones`, { method: 'POST', token: alice.token, body: { title: 'Evidence complete', phase: 'Research design', dueDate: '2026-11-30' } });
  check('project leader creates an audited project milestone', milestone.status === 201 && milestone.data.data.title === 'Evidence complete');
  const taskSuggestion = await api('/api/tasks', { method: 'POST', token: bob.token, body: { title: 'Propose validation interview', project: pid, acceptanceCriteria: 'Interview notes are attached.', milestone: milestone.data.data._id, phase: 'Research design' } });
  check('ordinary project member proposes work without creating an official assignment', taskSuggestion.status === 201 && taskSuggestion.data.data.kind === 'suggestion' && taskSuggestion.data.data.suggestionState === 'pending' && !taskSuggestion.data.data.assignedTo);
  const prematureSuggestedStart = await api(`/api/tasks/${taskSuggestion.data.data._id}/transition`, { method: 'POST', token: bob.token, body: { status: 'in_progress' } });
  check('pending task suggestions cannot start work', prematureSuggestedStart.status === 409);
  const acceptedSuggestion = await api(`/api/tasks/${taskSuggestion.data.data._id}/suggestion-decision`, { method: 'POST', token: alice.token, body: { decision: 'accept', assignedTo: bob.user.id } });
  check('project leader accepts and assigns a suggested task', acceptedSuggestion.status === 200 && acceptedSuggestion.data.data.kind === 'official' && acceptedSuggestion.data.data.assignedTo === bob.user.id);
  const taskComment = await api(`/api/tasks/${taskSuggestion.data.data._id}/comments`, { method: 'POST', token: bob.token, body: { body: 'I will attach the interview guide before starting.' } });
  const taskInstruction = await api(`/api/tasks/${taskSuggestion.data.data._id}/comments`, { method: 'POST', token: sup.token, body: { body: 'Use the approved consent language.', kind: 'supervisor_instruction' } });
  check('task comments and supervisor instructions do not alter lifecycle status', taskComment.status === 201 && taskInstruction.status === 201 && taskInstruction.data.data.status === 'todo' && taskInstruction.data.data.comments.length === 2);
  const staleTaskUpdate = await api(`/api/tasks/${taskSuggestion.data.data._id}`, { method: 'PUT', token: alice.token, body: { title: 'Stale write', revisionNumber: 0 } });
  check('task optimistic version rejects stale writes with a machine-readable conflict', staleTaskUpdate.status === 409 && staleTaskUpdate.data.code === 'STALE_TASK_VERSION');
  const datedPrerequisite = await api('/api/tasks', { method: 'POST', token: alice.token, body: { title: 'Late prerequisite', project: pid, acceptanceCriteria: 'Prerequisite evidence.', dueDate: '2026-12-01' } });
  const invalidDependentDate = await api('/api/tasks', { method: 'POST', token: alice.token, body: { title: 'Impossible dependent deadline', project: pid, acceptanceCriteria: 'Must follow its prerequisite.', dueDate: '2026-11-01', dependencies: [datedPrerequisite.data.data._id] } });
  check('dependent task deadline cannot precede its prerequisite', invalidDependentDate.status === 422);

  const inactiveAdd = await api(`/api/projects/${pid}/members`, { method: 'POST', token: alice.token, body: { email: emails.inactive } });
  check('inactive students cannot be added to an active project team', inactiveAdd.status === 400 && /active student/i.test(inactiveAdd.data.error));

  const dup = await api(`/api/projects/${pid}/members`, { method: 'POST', token: alice.token, body: { email: emails.bob } });
  check('duplicate member rejected', dup.status === 400);

  const evil = await api(`/api/projects/${pid}/members`, { method: 'POST', token: eve.token, body: { email: emails.eve } });
  check('outsider cannot add members (403)', evil.status === 403);

  const supAdd = await api(`/api/projects/${pid}/members`, { method: 'POST', token: alice.token, body: { email: emails.supervisor } });
  check('supervisor account rejected as member', supAdd.status === 400);

  // Bob got a notification
  const bobNotifs = await api('/api/notifications', { token: bob.token });
  check('teammate received invitation notification', bobNotifs.status === 200 && (bobNotifs.data.data || []).some(n => n.title.includes('Project invitation')), JSON.stringify(bobNotifs.data).slice(0, 120));
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
  check('student creates Proposal Version 2 after the automatic Version 1 draft', proposalDraft.status === 201 && proposalDraft.data?.data?.versionNo === 2 && proposalDraft.data?.data?.state === 'draft', JSON.stringify(proposalDraft.data));
  if (proposalDraft.status !== 201) throw new Error(`Proposal draft failed: ${JSON.stringify(proposalDraft.data)}`);

  const proposalSubmit = await api(`/api/proposals/${proposalDraft.data.data._id}/submit`, { method: 'POST', token: alice.token });
  check('student submits immutable follow-up proposal version', proposalSubmit.status === 200 && proposalSubmit.data.data.state === 'resubmitted');

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
  const studentProgressResponse = await api(`/api/progress-logs/${progress.data.data._id}/respond`, { method: 'POST', token: alice.token, body: { message: 'Self approved.' } });
  const supervisorProgressResponse = await api(`/api/progress-logs/${progress.data.data._id}/respond`, { method: 'POST', token: sup.token, body: { message: 'Blocker acknowledged. Complete the evidence table before the next meeting.' } });
  check('only the assigned supervisor can respond to a submitted progress log', studentProgressResponse.status === 403 && supervisorProgressResponse.status === 200 && supervisorProgressResponse.data.data.supervisorResponse.message.includes('evidence table'));
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
  check('project leader can assign a connected project task to another roster member', studentAssignedTask.status === 201 && studentAssignedTask.data.data.assignedTo === bob.user.id);
  const forgedDoneTask = await api('/api/tasks', { method: 'POST', token: alice.token, body: { title: 'Done Task', project: pid, status: 'completed' } });
  check('new tasks cannot be client-created as completed', forgedDoneTask.status === 201 && forgedDoneTask.data.data.status === 'todo');
  const teammateProjectTasks = await api(`/api/tasks?project=${pid}`, { token: bob.token });
  const teammatePersonalTasks = await api('/api/tasks', { token: bob.token });
  check('team members read shared project tasks while personal task lists include assigned work', teammateProjectTasks.status === 200 && teammateProjectTasks.data.data.some(task => task._id === studentAssignedTask.data.data._id) && teammatePersonalTasks.status === 200 && teammatePersonalTasks.data.data.some(task => task._id === studentAssignedTask.data.data._id));
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
  const prerequisiteSubmission = await api('/api/submissions', { method: 'POST', token: alice.token, body: { title: 'Evidence review deliverable', project: pid, task: prerequisite.data.data._id, content: 'The evidence review is complete with documented verification notes.' } });
  const prerequisiteReview = await api(`/api/tasks/${prerequisite.data.data._id}/request-review`, { method: 'POST', token: alice.token, body: { submissionId: prerequisiteSubmission.data.data._id } });
  const prerequisiteDone = await api(`/api/tasks/${prerequisite.data.data._id}/review-decision`, { method: 'POST', token: sup.token, body: { decision: 'approve', feedback: 'Evidence accepted.' } });
  check('task completion requires a linked deliverable and supervisor decision', prerequisiteStart.status === 200 && prerequisiteReview.status === 200 && prerequisiteDone.status === 200 && prerequisiteDone.data.data.status === 'done' && prerequisiteDone.data.submission.status === 'Graded');
  const dependentStart = await api(`/api/tasks/${dependent.data.data._id}/transition`, { method: 'POST', token: alice.token, body: { status: 'in_progress' } });
  const missingSubmissionReview = await api(`/api/tasks/${dependent.data.data._id}/request-review`, { method: 'POST', token: alice.token, body: {} });
  const dependentSubmission = await api('/api/submissions', { method: 'POST', token: alice.token, body: { title: 'Findings draft', project: pid, task: dependent.data.data._id, content: 'A complete findings draft linked to the task for supervisor review.' } });
  const dependentReview = await api(`/api/tasks/${dependent.data.data._id}/request-review`, { method: 'POST', token: alice.token, body: { submissionId: dependentSubmission.data.data._id } });
  const outsiderWithdraw = await api(`/api/tasks/${dependent.data.data._id}/withdraw-review`, { method: 'POST', token: bob.token });
  const withdrawnReview = await api(`/api/tasks/${dependent.data.data._id}/withdraw-review`, { method: 'POST', token: alice.token, body: { note: 'Attaching an updated analysis.' } });
  const resubmittedReview = await api(`/api/tasks/${dependent.data.data._id}/request-review`, { method: 'POST', token: alice.token, body: { submissionId: dependentSubmission.data.data._id } });
  check('assigned student can safely withdraw and resubmit an undecided review', outsiderWithdraw.status === 403 && withdrawnReview.status === 200 && withdrawnReview.data.data.status === 'in_progress' && withdrawnReview.data.submission.status === 'Submitted' && resubmittedReview.status === 200);
  const studentAccept = await api(`/api/tasks/${dependent.data.data._id}/review-decision`, { method: 'POST', token: alice.token, body: { decision: 'approve' } });
  const supervisorAccept = await api(`/api/tasks/${dependent.data.data._id}/review-decision`, { method: 'POST', token: sup.token, body: { decision: 'approve', feedback: 'Accepted.' } });
  check('review tasks reject missing evidence and require the assigned supervisor', dependentStart.status === 200 && missingSubmissionReview.status === 422 && dependentReview.status === 200 && studentAccept.status === 403 && supervisorAccept.status === 200);

  // ---- team policy
  const team = await api('/api/teams', { method: 'POST', token: alice.token, body: { name: 'Conflicting Team', project: pid } });
  check('separate team creation is retired in favor of the project roster', team.status === 410 && /project People & Supervision/i.test(team.data.error));

  // ---- connected student invitation and administrator allocation
  const inviteProject = await api('/api/projects', { method: 'POST', token: eve.token, body: { title: 'Invitation Project', description: 'Needs a supervisor.', department: 'CSE', section: 'CSE-4A' } });
  const directory = await api('/api/teams/directory/supervisors', { token: eve.token });
  check('student sees a privacy-limited supervisor directory with workload', directory.status === 200 && directory.data.data.some((item) => item._id === supTwo.user.id && Number.isInteger(item.activeProjects)) && !JSON.stringify(directory.data).includes(emails.supervisorTwo));
  const nonLeaderInvite = await api(`/api/projects/${inviteProject.data.data._id}/supervisor-invitations`, { method: 'POST', token: alice.token, body: { supervisorId: supTwo.user.id } });
  check('student outside the team cannot invite a supervisor', nonLeaderInvite.status === 403);
  const supervisorInvite = await api(`/api/projects/${inviteProject.data.data._id}/supervisor-invitations`, { method: 'POST', token: eve.token, body: { supervisorId: supTwo.user.id, message: 'We need guidance on our evaluation plan.' } });
  const invitationId = supervisorInvite.data?.data?.supervisorInvitations?.find((item) => item.state === 'pending')?._id;
  check('project leader can invite an available supervisor', supervisorInvite.status === 201 && !!invitationId);
  const wrongSupervisorResponse = await api(`/api/projects/${inviteProject.data.data._id}/supervisor-invitations/${invitationId}/respond`, { method: 'POST', token: sup.token, body: { decision: 'accept' } });
  check('only the invited supervisor can respond', wrongSupervisorResponse.status === 403);
  const pendingInvitations = await api('/api/projects/invitations/mine', { token: supTwo.token });
  check('invited supervisor can see pending project context', pendingInvitations.status === 200 && pendingInvitations.data.data.some((item) => item._id === inviteProject.data.data._id));
  const supervisorInvitationDashboard = await api('/api/dashboard/supervisor', { token: supTwo.token });
  check('supervisor dashboard prioritizes its invitation inbox', supervisorInvitationDashboard.status === 200 && supervisorInvitationDashboard.data.data.pendingInvitations.some((item) => item._id === inviteProject.data.data._id));
  const acceptedInvitation = await api(`/api/projects/${inviteProject.data.data._id}/supervisor-invitations/${invitationId}/respond`, { method: 'POST', token: supTwo.token, body: { decision: 'accept' } });
  const acceptedProject = await api(`/api/projects/${inviteProject.data.data._id}`, { token: eve.token });
  check('accepting an invitation connects supervisor access to the canonical project', acceptedInvitation.status === 200 && acceptedInvitation.data.data.supervisor?._id === supTwo.user.id && acceptedProject.data.data.supervisor?._id === supTwo.user.id && acceptedProject.data.data.supervisionSource === 'student_invitation');

  const adminProject = await api('/api/projects', { method: 'POST', token: bob.token, body: { title: 'Admin Allocation Project', department: 'CSE', section: 'CSE-4B' } });
  const studentAdminAccess = await api('/api/admin/supervision', { token: bob.token });
  check('students cannot access administration allocation data', studentAdminAccess.status === 403);
  const adminOverview = await api('/api/admin/supervision', { token: admin.token });
  check('admin receives connected project, team, and supervisor workload data', adminOverview.status === 200 && adminOverview.data.data.projects.some((item) => item._id === adminProject.data.data._id) && adminOverview.data.data.supervisors.some((item) => item._id === sup.user.id));
  const adminAssign = await api(`/api/admin/projects/${adminProject.data.data._id}/supervisor`, { method: 'PUT', token: admin.token, body: { supervisorId: sup.user.id, department: 'CSE', section: 'CSE-4B' } });
  const adminAssignedProject = await api(`/api/projects/${adminProject.data.data._id}`, { token: bob.token });
  check('admin can assign a supervisor by section with audited ownership metadata', adminAssign.status === 200 && adminAssignedProject.data.data.supervisor?._id === sup.user.id && adminAssignedProject.data.data.section === 'CSE-4B' && adminAssignedProject.data.data.supervisionSource === 'admin_assignment');

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
  const uploadTask = await api('/api/tasks', { method: 'POST', token: alice.token, body: { title: 'Prepare final deliverable', project: pid, assignedTo: alice.user.id, acceptanceCriteria: 'A reviewable final deliverable is attached.' } });
  await api(`/api/tasks/${uploadTask.data.data._id}/transition`, { method: 'POST', token: alice.token, body: { status: 'in_progress' } });
  const unlinkedSubmission = await api('/api/submissions', { method: 'POST', token: alice.token, body: { title: 'Unlinked reflection', project: pid, content: 'This must be connected to an actual task.' } });
  check('deliverables cannot exist outside the project task workflow', unlinkedSubmission.status === 422);
  const textOnly = await api('/api/submissions', { method: 'POST', token: alice.token, body: { title: 'Text-only reflection', project: pid, task: uploadTask.data.data._id, content: 'This text-only submission remains usable when production object storage is not configured.' } });
  check('student can submit text without a local production upload', textOnly.status === 201 && !textOnly.data.data.fileUrl && textOnly.data.data.content.length > 0);
  const supervisorSubmission = await api('/api/submissions', { method: 'POST', token: sup.token, body: { title: 'Forged', project: pid, content: 'This must be rejected because only students submit deliverables.' } });
  check('supervisor cannot impersonate a student submission', supervisorSubmission.status === 403);
  const sub = await api('/api/submissions', { method: 'POST', token: alice.token, body: { title: 'Draft 1', project: pid, task: uploadTask.data.data._id, fileUrl: upData.data.fileUrl, content: 'This is a sufficiently detailed research submission text used to preserve the original work for an integrity screen. It describes the study design, evaluation criteria, ethical safeguards, and limitations without asserting that any automated screen is a plagiarism verdict.', status: 'Graded', grade: 'A+', student: eve.user.id } });
  check('submission created with uploaded file and text', sub.status === 201 && sub.data.data.content.length >= 200);
  check('student cannot pre-grade or impersonate a submission', sub.data.data.status === 'Submitted' && !sub.data.data.grade && sub.data.data.student === alice.user.id);

  const finalReview = await api(`/api/tasks/${uploadTask.data.data._id}/request-review`, { method: 'POST', token: alice.token, body: { submissionId: sub.data.data._id } });
  const grade = await api(`/api/tasks/${uploadTask.data.data._id}/review-decision`, { method: 'POST', token: sup.token, body: { decision: 'approve', grade: 'A', feedback: 'Nice work' } });
  check('supervisor grades the linked submission through the task review', finalReview.status === 200 && grade.status === 200 && grade.data.submission.grade === 'A' && grade.data.data.status === 'done');
  const gradedEdit = await api(`/api/submissions/${sub.data.data._id}`, { method: 'PUT', token: alice.token, body: { content: 'Attempted post-grade replacement.' } });
  check('student cannot edit a graded submission', gradedEdit.status === 409);

  const aliceNotifs = await api('/api/notifications', { token: alice.token });
  check('student notified of feedback', (aliceNotifs.data.data || []).some(n => n.title === 'Feedback received'));

  const leaderSelfRemoval = await api(`/api/projects/${pid}/members/${alice.user.id}`, { method: 'DELETE', token: alice.token });
  const leadershipTransfer = await api(`/api/projects/${pid}/leader`, { method: 'PUT', token: alice.token, body: { userId: bob.user.id } });
  const projectHistory = await api(`/api/projects/${pid}/history`, { token: bob.token });
  check('project leader cannot leave before transferring ownership', leaderSelfRemoval.status === 409);
  check('leadership transfer and immutable project history are available to the roster', leadershipTransfer.status === 200 && String(leadershipTransfer.data.data.leaderUserId?._id || leadershipTransfer.data.data.leaderUserId) === bob.user.id && projectHistory.status === 200 && projectHistory.data.data.some((event) => event.action === 'project.leadership_transferred'));

  const protectedDeletion = await api(`/api/projects/${pid}`, { method: 'DELETE', token: sup.token });
  check('project with academic records cannot be deleted and orphan data', protectedDeletion.status === 409);

  // ---- institution boundary regression
  const foreignInstitution = await Institution.create({ name: 'Boundary Test University', slug: `boundary-${runId}`, createdBy: adminUser._id });
  const foreignStudent = await User.create({ name: 'Foreign Student', email: `foreign-${runId}@test.com`, password: 'pass1234', role: 'student', institution: foreignInstitution._id, emailVerified: true, onboardingStatus: 'complete' });
  const foreignProject = await Project.create({ title: 'Foreign institution project', institution: foreignInstitution._id, students: [foreignStudent._id], leaderUserId: foreignStudent._id, status: 'active' });
  const crossTenantProject = await api(`/api/projects/${foreignProject._id}`, { token: admin.token });
  const tenantProjectList = await api('/api/projects', { token: admin.token });
  const tenantUserList = await api('/api/admin/users', { token: admin.token });
  check('institution administrators cannot read another institution project', crossTenantProject.status === 403);
  check('institution project and account directories exclude other tenants', tenantProjectList.status === 200 && !tenantProjectList.data.data.some((item) => item._id === String(foreignProject._id)) && tenantUserList.status === 200 && !tenantUserList.data.data.some((item) => item._id === String(foreignStudent._id)));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
};

run().catch(e => { console.error('Smoke run crashed:', e); process.exit(1); });
