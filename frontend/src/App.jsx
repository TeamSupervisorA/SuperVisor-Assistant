import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import { ThemeProvider } from './components/ThemeContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import TasksMilestones from './pages/TasksMilestones';
import TeamManagement from './pages/TeamManagement';
import ProjectResourceLibrary from './pages/ProjectResourceLibrary';
import CreateNewWork from './pages/CreateNewWork';
import DetailedFeedback from './pages/DetailedFeedback';
import MeetingManagement from './pages/MeetingManagement';
import CourseManagement from './pages/CourseManagement';
import Settings from './pages/Settings';
import ProjectChat from './pages/ProjectChat';
import PlagiarismChecker from './pages/PlagiarismChecker';
import StudentSubmissions from './pages/StudentSubmissions';
import EvaluationsGrades from './pages/EvaluationsGrades';
import ExploreProjects from './pages/ExploreProjects';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          
          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Student */}
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/explore" element={<ExploreProjects />} />
              <Route path="/tasks-milestones" element={<TasksMilestones />} />
              <Route path="/team-management" element={<TeamManagement />} />
              <Route path="/project-resource-library" element={<ProjectResourceLibrary />} />
              <Route path="/create-new-work" element={<CreateNewWork />} />
              <Route path="/student-submissions" element={<StudentSubmissions />} />
              <Route path="/detailed-feedback" element={<DetailedFeedback />} />
              <Route path="/meeting-management" element={<MeetingManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chat" element={<ProjectChat />} />

              {/* Supervisor + Admin only */}
              <Route element={<ProtectedRoute roles={['supervisor', 'admin']} />}>
                <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />
                <Route path="/plagiarism-checker" element={<PlagiarismChecker />} />
                <Route path="/evaluations" element={<EvaluationsGrades />} />
              </Route>

              {/* Admin only */}
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/course-management" element={<CourseManagement />} />
              </Route>
            </Route>
          </Route>

          {/* 404 Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
