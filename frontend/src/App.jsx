import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLogin from './pages/AdminLogin';
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
import PlagiarismChecker from './pages/PlagiarismChecker';
import RubricMarking from './pages/RubricMarking';
import CourseManagement from './pages/CourseManagement';
import TemplateManagement from './pages/TemplateManagement';
import SystemReports from './pages/SystemReports';
import Settings from './pages/Settings';
import ExploreProjects from './pages/ExploreProjects';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/explore" element={<ExploreProjects />} />
            <Route path="/tasks-milestones" element={<TasksMilestones />} />
            <Route path="/team-management" element={<TeamManagement />} />
            <Route path="/project-resource-library" element={<ProjectResourceLibrary />} />
            <Route path="/create-new-work" element={<CreateNewWork />} />
            <Route path="/detailed-feedback" element={<DetailedFeedback />} />
            <Route path="/meeting-management" element={<MeetingManagement />} />
            <Route path="/settings" element={<Settings />} />

            {/* Supervisor + Admin only */}
            <Route element={<ProtectedRoute roles={['supervisor', 'admin']} />}>
              <Route path="/supervisor-dashboard" element={<SupervisorDashboard />} />
              <Route path="/plagiarism-checker" element={<PlagiarismChecker />} />
              <Route path="/rubric-marking" element={<RubricMarking />} />
            </Route>

            {/* Admin only */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/course-management" element={<CourseManagement />} />
              <Route path="/template-management" element={<TemplateManagement />} />
              <Route path="/system-reports" element={<SystemReports />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
