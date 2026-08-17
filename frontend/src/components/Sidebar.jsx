import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import BrandLogo from './BrandLogo';

const Sidebar = ({ isCollapsed, toggleCollapse, closeMobile }) => {
  const location = useLocation();
  const { user } = useAuth();
  const role = user?.role || 'student';

  // Role-based nav items
  const commonItems = [
    { name: 'Chat', icon: 'chat', path: '/chat' },
  ];

  const studentItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'My Projects', icon: 'folder_open', path: '/explore' },
    { name: 'Tasks & Milestones', icon: 'checklist', path: '/tasks-milestones' },
    { name: 'Progress Logs', icon: 'timeline', path: '/progress-logs' },
    { name: 'Submissions', icon: 'upload_file', path: '/student-submissions' },
    { name: 'Plagiarism Check', icon: 'policy', path: '/plagiarism-checker' },
    { name: 'Team', icon: 'groups', path: '/team-management' },
    { name: 'Meetings', icon: 'event', path: '/meeting-management' },
    { name: 'Resources', icon: 'library_books', path: '/project-resource-library' },
    { name: 'Paper Editor', icon: 'article', path: '/paper-editor', dividerBefore: true },
    { name: 'Code IDE', icon: 'terminal', path: '/code-ide' },
    { name: 'Report', icon: 'summarize', path: '/project-report' },
    { name: 'Proposals', icon: 'article', path: '/proposals' },
    { name: 'Reviews', icon: 'rate_review', path: '/reviews' },
    ...commonItems.map((item) => ({ ...item, dividerBefore: true })),
    { name: 'Settings', icon: 'settings', path: '/settings', dividerBefore: true },
  ];

  const supervisorItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/supervisor-dashboard' },
    { name: 'Project Directory', icon: 'folder_open', path: '/explore' },
    { name: 'New Project', icon: 'add_circle', path: '/create-new-work' },
    { name: 'Tasks & Milestones', icon: 'checklist', path: '/tasks-milestones' },
    { name: 'Deliverables', icon: 'upload_file', path: '/student-submissions' },
    { name: 'Progress Logs', icon: 'timeline', path: '/progress-logs' },
    { name: 'Evaluations', icon: 'grading', path: '/evaluations' },
    { name: 'Plagiarism Check', icon: 'policy', path: '/plagiarism-checker' },
    { name: 'Team', icon: 'groups', path: '/team-management' },
    { name: 'Meetings', icon: 'event', path: '/meeting-management' },
    { name: 'Resources', icon: 'library_books', path: '/project-resource-library' },
    { name: 'Paper Editor', icon: 'article', path: '/paper-editor', dividerBefore: true },
    { name: 'Code IDE', icon: 'terminal', path: '/code-ide' },
    { name: 'Report', icon: 'summarize', path: '/project-report' },
    { name: 'Proposals', icon: 'article', path: '/proposals' },
    { name: 'Reviews', icon: 'rate_review', path: '/reviews' },
    ...commonItems.map((item) => ({ ...item, dividerBefore: true })),
    { name: 'Settings', icon: 'settings', path: '/settings', dividerBefore: true },
  ];

  const adminItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/admin-dashboard' },
    { name: 'Project Directory', icon: 'folder_open', path: '/explore' },
    { name: 'Course Management', icon: 'school', path: '/course-management' },
    { name: 'Users & Departments', icon: 'manage_accounts', path: '/admin-management' },
    { name: 'Plagiarism Check', icon: 'policy', path: '/plagiarism-checker' },
    ...commonItems.map((item) => ({ ...item, dividerBefore: true })),
    { name: 'Settings', icon: 'settings', path: '/settings', dividerBefore: true },
  ];

  const navItems = role === 'admin' ? adminItems : role === 'supervisor' ? supervisorItems : studentItems;

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative z-50 h-full shrink-0 bg-surface"
    >
      <div className="flex flex-col h-full border-r border-outline-variant/30 overflow-hidden bg-surface relative">
        {/* Header */}
        <div className={`flex h-20 shrink-0 items-center border-b border-outline-variant/20 ${isCollapsed ? 'justify-center px-3' : 'justify-between px-4'}`}>
          <div className="flex min-w-0 items-center gap-3 overflow-hidden whitespace-nowrap">
            <Link
              to={role === 'admin' ? '/admin-dashboard' : role === 'supervisor' ? '/supervisor-dashboard' : '/dashboard'}
              onClick={closeMobile}
              aria-label="Supervisor Assistant home"
              className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-md shadow-primary/10 dark:border-white/10 dark:bg-[#11131a] dark:shadow-primary/15 ${isCollapsed ? 'h-11 w-11 p-1.5' : 'h-12 w-[174px] px-3 py-2'}`}
            >
              <BrandLogo compact={isCollapsed} className={isCollapsed ? 'h-full w-full' : 'h-auto w-full'} />
            </Link>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <p className="sr-only capitalize">{role} workspace</p>
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
          <div className={`shrink-0 ${isCollapsed ? 'mt-3 px-3' : 'mt-5 px-3'}`}>
            <Link 
              to="/create-new-work" 
              onClick={closeMobile}
              className={`flex w-full items-center bg-primary font-label-md text-[13px] font-semibold text-on-primary shadow-sm transition-all hover:bg-surface-tint hover:shadow-md hover:shadow-primary/20 active:scale-95 ${isCollapsed ? 'h-12 justify-center rounded-2xl' : 'h-11 justify-center gap-2 rounded-xl'}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
              {!isCollapsed && <span>Create New Work</span>}
            </Link>
          </div>
        )}
        
        {/* Navigation */}
        <nav aria-label="Primary navigation" className={`sidebar-nav flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden ${isCollapsed ? 'sidebar-nav--collapsed gap-1 px-2 py-3' : 'gap-0.5 px-3 py-4'}`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <React.Fragment key={item.name}>
                {item.dividerBefore && <div aria-hidden="true" className={`shrink-0 border-t border-outline-variant/25 ${isCollapsed ? 'mx-2 my-1.5' : 'mx-3 my-2'}`} />}
                <Link
                  to={item.path}
                  onClick={closeMobile}
                  title={isCollapsed ? item.name : ''}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex shrink-0 items-center rounded-xl font-medium transition-all duration-200 active:scale-[0.97] ${isCollapsed ? 'h-10 justify-center px-0' : 'gap-3 px-3 py-2.5'}
                    ${isActive
                      ? 'bg-primary/12 text-primary font-bold ring-1 ring-inset ring-primary/10'
                      : 'text-secondary hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                >
                  <span className={`material-symbols-outlined text-[22px] ${isActive ? 'icon-fill' : 'transition-transform group-hover:scale-110'}`}>{item.icon}</span>
                  {!isCollapsed && <span className="whitespace-nowrap text-[14px]">{item.name}</span>}
                  {isActive && !isCollapsed && (
                    <motion.div layoutId="sidebar-active" className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              </React.Fragment>
            );
          })}
        </nav>
        
      </div>

      {/* Toggle Collapse Button (Desktop Only) */}
      <button 
        type="button"
        onClick={toggleCollapse} 
        aria-label={isCollapsed ? 'Keep sidebar open' : 'Allow sidebar to collapse'}
        title={isCollapsed ? 'Keep sidebar open' : 'Allow sidebar to collapse'}
        className="absolute -right-4 top-6 z-[60] hidden h-8 w-8 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-low text-on-surface-variant shadow-md transition-colors hover:border-primary/35 hover:bg-surface-container hover:text-primary md:flex"
      >
        <span className="material-symbols-outlined text-[18px]">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>
    </motion.aside>
  );
};

export default Sidebar;
