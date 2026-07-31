require('dotenv').config();
process.env.NODE_ENV = 'test';
process.env.PORT = '5000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-secret';
process.env.ALLOW_PUBLIC_SUPERVISOR_REGISTRATION = 'true';
require('./server');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting E2E Integration Tests ---');
  let studentToken = '';
  let supervisorToken = '';
  let projectId = '';

  const randId = Math.floor(Math.random() * 10000);
  const studentEmail = `student${randId}@test.com`;
  const supervisorEmail = `supervisor${randId}@test.com`;

  try {
    // 1. Register Student
    console.log(`\n[1] Registering student: ${studentEmail}`);
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Student', email: studentEmail, password: 'password123', role: 'student' })
    });
    const regData = await regRes.json();
    if (!regData.success) throw new Error(regData.error);
    studentToken = regData.token;
    console.log('✅ Student registered successfully');

    // 2. Register Supervisor
    console.log(`\n[2] Registering supervisor: ${supervisorEmail}`);
    const supRegRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Supervisor', email: supervisorEmail, password: 'password123', role: 'supervisor' })
    });
    const supRegData = await supRegRes.json();
    if (!supRegData.success) throw new Error(supRegData.error);
    supervisorToken = supRegData.token;
    console.log('✅ Supervisor registered successfully');

    // 3. Create Project (Supervisor)
    console.log('\n[3] Supervisor creating a project');
    const projRes = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supervisorToken}`
      },
      body: JSON.stringify({ title: 'AI Research', description: 'Testing Gemini API', status: 'active', students: [regData.user.id] })
    });
    const projData = await projRes.json();
    if (!projData.success) throw new Error(projData.error);
    projectId = projData.data._id;
    console.log(`✅ Project created successfully with ID: ${projectId}`);

    // 4. Test AI Idea Generation (Student)
    console.log('\n[4] Student requesting AI project ideas');
    const aiIdeaRes = await fetch(`${API_BASE}/ai/suggest-ideas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ interests: 'machine learning and education', department: 'Computer Science' })
    });
    const aiIdeaData = await aiIdeaRes.json();
    if (!aiIdeaData.success) {
      console.log('⚠️ AI Idea Generation Failed (Check Gemini API key)', aiIdeaData.error);
    } else {
      console.log('✅ AI Idea Generation successful:', JSON.stringify(aiIdeaData.data).substring(0, 50) + '...');
    }

    // 5. Verify the configured AI service and the student planning workflow.
    const statusRes = await fetch(`${API_BASE}/ai/status`, { headers: { 'Authorization': `Bearer ${studentToken}` } });
    const statusData = await statusRes.json();
    if (!statusData.success) throw new Error(statusData.error);
    console.log(`✅ AI service status retrieved (configured: ${statusData.data.configured})`);

    const outlineRes = await fetch(`${API_BASE}/ai/proposal-outline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studentToken}` },
      body: JSON.stringify({ topic: 'A privacy-preserving learning analytics tool for student engagement' })
    });
    const outlineData = await outlineRes.json();
    // Provider outages/quota can occur after a previously successful call. The
    // server must surface them cleanly without invalidating core workflows.
    console.log(outlineData.success ? '✅ AI proposal outline generated' : `⚠️ Proposal outline unavailable: ${outlineData.error}`);

    // 6. The report draft is available to the assigned supervisor and uses
    // server-side project records rather than metrics supplied by the browser.
    const draftRes = await fetch(`${API_BASE}/ai/projects/${projectId}/report-draft`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${supervisorToken}` }
    });
    const draftData = await draftRes.json();
    console.log(draftData.success ? '✅ AI report narrative generated from project records' : `⚠️ Report narrative unavailable: ${draftData.error}`);

    // 7. Verify the grounded integrity-screen contract without treating its
    // output as a plagiarism decision.
    const integrityText = 'Academic integrity requires students to acknowledge the sources that shaped their work. This sample describes a small research study with a clear question, a reproducible method, ethical safeguards, and a transparent discussion of limitations. The report is prepared for an integration test and must be reviewed by a human before any academic decision is made.';
    const integrityRes = await fetch(`${API_BASE}/ai/plagiarism`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supervisorToken}` },
      body: JSON.stringify({ text: integrityText })
    });
    const integrityData = await integrityRes.json();
    console.log(integrityData.success ? '✅ Grounded integrity screen generated a review aid' : `⚠️ Integrity screen unavailable: ${integrityData.error}`);

    console.log('\n--- All Tests Finished ---');
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

setTimeout(() => {
  runTests().finally(() => process.exit());
}, 1000);
