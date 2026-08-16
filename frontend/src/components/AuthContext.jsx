import React, { createContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const roleHome = {
  student: '/dashboard',
  supervisor: '/supervisor-dashboard',
  admin: '/admin-dashboard'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedActiveProject = localStorage.getItem('activeProject');
    
    if (storedActiveProject) {
      try {
        setActiveProject(JSON.parse(storedActiveProject));
      } catch {
        localStorage.removeItem('activeProject');
      }
    }

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const normalizedUser = { ...parsedUser, _id: parsedUser._id || parsedUser.id };
        setToken(storedToken);
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleInvalidSession = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('activeProject');
      setToken(null);
      setUser(null);
      setActiveProject(null);
    };
    window.addEventListener('auth-invalid', handleInvalidSession);
    return () => window.removeEventListener('auth-invalid', handleInvalidSession);
  }, []);

  const login = (tokenValue, userData) => {
    const normalizedUser = { ...userData, _id: userData._id || userData.id };
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.removeItem('activeProject');
    setToken(tokenValue);
    setUser(normalizedUser);
    setActiveProject(null);
  };

  const updateUser = (userData) => {
    const normalizedUser = { ...userData, _id: userData._id || userData.id };
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setUser(normalizedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeProject');
    setToken(null);
    setUser(null);
    setActiveProject(null);
  };

  const handleSetActiveProject = useCallback((project) => {
    if (project) {
      localStorage.setItem('activeProject', JSON.stringify(project));
    } else {
      localStorage.removeItem('activeProject');
    }
    setActiveProject(project);
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    return roleHome[user.role] || '/dashboard';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      activeProject,
      setActiveProject: handleSetActiveProject,
      login, 
      updateUser,
      logout, 
      getDashboardPath, 
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
