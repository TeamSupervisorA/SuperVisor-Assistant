require('dotenv').config();

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
      body: JSON.stringify({ title: 'AI Research', description: 'Testing Gemini API', status: 'active', students: [regData.user._id] })
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

    console.log('\n--- All Tests Finished ---');
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
  }
}

runTests();
