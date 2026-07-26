/* Smoke test for the feature round: member management, report, team policy, upload, notifications */
process.env.NODE_ENV = 'test';
process.env.PORT = '5099';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-secret';

require('./server');

const BASE = 'http://localhost:5099';
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

  // ---- users
  const reg = async (name, email, role) =>
    (await api('/api/auth/register', { method: 'POST', body: { name, email, password: 'pass1234', role } })).data;
  const alice = await reg('Alice', 'alice@test.com', 'student');
  const bob = await reg('Bob', 'bob@test.com', 'student');
  const eve = await reg('Eve', 'eve@test.com', 'student');
  const sup = await reg('Dr. Sup', 'sup@test.com', 'supervisor');

  // ---- supervisor creates a project and assigns its first student
  const proj = await api('/api/projects', { method: 'POST', token: sup.token, body: { title: 'Smoke Project', description: 'x', students: [alice.user.id] } });
  check('supervisor creates a project', proj.status === 201);
  const pid = proj.data.data._id;

  // ---- member management
  const add = await api(`/api/projects/${pid}/members`, { method: 'POST', token: alice.token, body: { email: 'bob@test.com' } });
  check('member adds teammate by email', add.status === 200 && add.data.data.students.length === 2);

  const dup = await api(`/api/projects/${pid}/members`, { method: 'POST', token: alice.token, body: { email: 'bob@test.com' } });
  check('duplicate member rejected', dup.status === 400);

  const evil = await api(`/api/projects/${pid}/members`, { method: 'POST', token: eve.token, body: { email: 'eve@test.com' } });
  check('outsider cannot add members (403)', evil.status === 403);

  const supAdd = await api(`/api/projects/${pid}/members`, { method: 'POST', token: alice.token, body: { email: 'sup@test.com' } });
  check('supervisor account rejected as member', supAdd.status === 400);

  // Bob got a notification
  const bobNotifs = await api('/api/notifications', { token: bob.token });
  check('teammate received notification', bobNotifs.status === 200 && (bobNotifs.data.data || []).some(n => n.title.includes('Added to a project team')), JSON.stringify(bobNotifs.data).slice(0, 120));

  // ---- report
  const rep = await api(`/api/projects/${pid}/report`, { token: alice.token });
  check('member can fetch report', rep.status === 200 && rep.data.data.projectTitle === 'Smoke Project');
  check('report has summary/progress/health', typeof rep.data.data.summary === 'string' && typeof rep.data.data.progressPercentage === 'number' && !!rep.data.data.health);

  const repEve = await api(`/api/projects/${pid}/report`, { token: eve.token });
  check('outsider cannot fetch report (403)', repEve.status === 403);

  // ---- immutable proposal lifecycle
  const proposalDraft = await api(`/api/projects/${pid}/proposals`, { method: 'POST', token: alice.token, body: { title: 'Smoke Proposal', content: 'A versioned proposal for the smoke test.' } });
  check('student creates proposal draft', proposalDraft.status === 201 && proposalDraft.data?.data?.versionNo === 1 && proposalDraft.data?.data?.state === 'draft', JSON.stringify(proposalDraft.data));
  if (proposalDraft.status !== 201) throw new Error(`Proposal draft failed: ${JSON.stringify(proposalDraft.data)}`);

  const proposalSubmit = await api(`/api/proposals/${proposalDraft.data.data._id}/submit`, { method: 'POST', token: alice.token });
  check('student submits immutable proposal version', proposalSubmit.status === 200 && proposalSubmit.data.data.state === 'submitted');

  const proposalEve = await api(`/api/projects/${pid}/proposals`, { token: eve.token });
  check('outsider cannot view proposal versions (403)', proposalEve.status === 403);

  const proposalDecision = await api(`/api/proposals/${proposalDraft.data.data._id}/decision`, { method: 'POST', token: sup.token, body: { decision: 'revision_requested', comment: 'Add scope detail.' } });
  check('assigned supervisor decides exact proposal version', proposalDecision.status === 200 && proposalDecision.data.data.state === 'revision_requested');

  const review = await api('/api/reviews', { method: 'POST', token: sup.token, body: { proposalVersion: proposalDraft.data.data._id, overallComment: 'Clarify the proposed method.', findings: [{ section: 'Methodology', severity: 'medium', explanation: 'Sampling strategy is incomplete.', recommendation: 'State the sample frame.' }] } });
  check('assigned supervisor creates version-linked review', review.status === 201 && review.data.data.proposalVersion === proposalDraft.data.data._id);
  const reviewSubmit = await api(`/api/reviews/${review.data.data._id}/submit`, { method: 'POST', token: sup.token });
  check('supervisor submits review', reviewSubmit.status === 200 && reviewSubmit.data.data.state === 'submitted');

  // ---- immutable weekly progress log
  const progress = await api(`/api/projects/${pid}/progress-logs`, { method: 'POST', token: alice.token, body: { weekStart: '2026-07-20', summary: 'Completed initial research.' } });
  check('student creates progress log', progress.status === 201 && progress.data.data.state === 'draft');
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
  await api('/api/tasks', { method: 'POST', token: alice.token, body: { title: 'Done Task', project: pid, status: 'completed' } });
  const rep2 = await api(`/api/projects/${pid}/report`, { token: alice.token });
  const ts = rep2.data.data.taskSummary;
  check('report detects delayed task', ts.delayed === 1 && ts.completed === 1 && rep2.data.data.progressPercentage === 50, JSON.stringify(ts));

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

  // ---- upload from device (multipart)
  const fd = new FormData();
  fd.append('file', new Blob(['hello smoke'], { type: 'text/plain' }), 'smoke.txt');
  const upRes = await fetch(`${BASE}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${alice.token}` }, body: fd });
  const upData = await upRes.json();
  check('file upload works', upRes.status === 200 && upData.data.fileUrl.startsWith('/uploads/'), JSON.stringify(upData).slice(0, 120));

  const fileFetch = await fetch(`${BASE}${upData.data.fileUrl}`);
  check('uploaded file is served statically', fileFetch.status === 200 && (await fileFetch.text()) === 'hello smoke');

  // ---- submission + grading notifications
  const sub = await api('/api/submissions', { method: 'POST', token: alice.token, body: { title: 'Draft 1', project: pid, fileUrl: upData.data.fileUrl } });
  check('submission created with uploaded file', sub.status === 201);

  const grade = await api(`/api/submissions/${sub.data.data._id}`, { method: 'PUT', token: sup.token, body: { grade: 'A', feedback: 'Nice work', status: 'Graded' } });
  check('supervisor grades submission', grade.status === 200 && grade.data.data.grade === 'A');

  const aliceNotifs = await api('/api/notifications', { token: alice.token });
  check('student notified of feedback', (aliceNotifs.data.data || []).some(n => n.title === 'Feedback received'));

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
};

run().catch(e => { console.error('Smoke run crashed:', e); process.exit(1); });
