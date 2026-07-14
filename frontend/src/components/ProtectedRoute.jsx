import { Navigate, Outlet, useLocation } from 'react-router-dom';

const roleHome = {
  student: '/dashboard',
  supervisor: '/supervisor-dashboard',
  admin: '/admin-dashboard'
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

// Wrap routes that require login. Optionally restrict to specific roles:
// <Route element={<ProtectedRoute roles={['admin']} />}> ... </Route>
const ProtectedRoute = ({ roles }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Logged in but wrong role — send them to their own dashboard
    return <Navigate to={roleHome[user.role] || '/dashboard'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
