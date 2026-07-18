import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from './AuthContext';

const Sidebar = ({ isCollapsed, toggleCollapse, closeMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || 'student';

  // Role-based nav items
  const commonItems = [
    { name: 'Chat', icon: 'chat', path: '/chat' },
  ];

  const studentItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Tasks & Milestones', icon: 'checklist', path: '/tasks-milestones' },
    { name: 'Submissions', icon: 'upload_file', path: '/student-submissions' },
    { name: 'Team', icon: 'groups', path: '/team-management' },
    { name: 'Resources', icon: 'library_books', path: '/project-resource-library' },
    ...commonItems,
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  const supervisorItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/supervisor-dashboard' },
    { name: 'Tasks & Milestones', icon: 'checklist', path: '/tasks-milestones' },
    { name: 'Evaluations', icon: 'grading', path: '/evaluations' },
    { name: 'Plagiarism', icon: 'policy', path: '/plagiarism-checker' },
    { name: 'Feedback', icon: 'rate_review', path: '/detailed-feedback' },
    ...commonItems,
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  const adminItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/admin-dashboard' },
    { name: 'Course Management', icon: 'school', path: '/course-management' },
    ...commonItems,
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  const navItems = role === 'admin' ? adminItems : role === 'supervisor' ? supervisorItems : studentItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-surface h-full flex flex-col border-r border-outline-variant/30 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className={`p-4 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-outline-variant/20 h-20 shrink-0`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} overflow-hidden whitespace-nowrap`}>
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary-fixed-variant flex items-center justify-center shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-on-primary icon-fill text-[22px]">school</span>
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-headline-md text-[18px] font-bold text-primary leading-tight tracking-tight">Academic AI</h1>
              <p className="font-label-md text-[11px] text-secondary capitalize">{role} portal</p>
            </motion.div>
          )}
        </div>
        
        <button 
          onClick={closeMobile} 
          className="md:hidden flex p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      
      {/* New Work Button */}
      {role === 'student' && (
        <div className="px-3 mt-5 shrink-0">
          <Link 
            to="/create-new-work" 
            onClick={closeMobile}
            className={`w-full bg-primary text-on-primary h-11 rounded-xl flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} font-label-md text-[13px] font-semibold hover:bg-surface-tint transition-all shadow-sm hover:shadow-md hover:shadow-primary/20 active:scale-95`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
            {!isCollapsed && <span>Create New Work</span>}
          </Link>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path} 
              onClick={closeMobile}
              title={isCollapsed ? item.name : ''}
              className={`flex items-center ${isCollapsed ? 'justify-center font-bold' : 'gap-3 px-3'} py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-[0.97] group
                ${isActive 
                  ? 'bg-primary/10 text-primary font-bold' 
                  : 'text-secondary hover:bg-surface-container-low hover:text-on-surface'
                }`}
            >
              <span className={`material-symbols-outlined text-[22px] ${isActive ? 'icon-fill' : 'group-hover:scale-110 transition-transform'}`}>{item.icon}</span>
              {!isCollapsed && <span className="whitespace-nowrap text-[14px]">{item.name}</span>}
              {isActive && !isCollapsed && (
                <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Footer — Logout */}
      <div className="px-3 py-4 border-t border-outline-variant/20 shrink-0">
        {user && (
          <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 mb-2`}>
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-[13px] shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="font-label-md text-[13px] font-semibold text-on-surface truncate">{user.name}</p>
                <p className="font-label-md text-[11px] text-outline truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}
        <button 
          onClick={handleLogout}
          title={isCollapsed ? 'Logout' : ''}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2.5 rounded-xl text-secondary hover:bg-error-container hover:text-error transition-colors duration-200 active:scale-[0.97]`}
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          {!isCollapsed && <span className="whitespace-nowrap text-[14px] font-medium">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
