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
  const studentItems = [
    { name: 'Overview', icon: 'dashboard', path: '/dashboard' },
    { name: 'Projects', icon: 'folder_open', path: '/explore' },
    { name: 'Work', icon: 'checklist', path: '/tasks-milestones' },
    { name: 'Deliverables', icon: 'upload_file', path: '/student-submissions' },
    { name: 'Supervision', icon: 'groups', path: '/team-management' },
    { name: 'Meetings', icon: 'event', path: '/meeting-management' },
    { name: 'Team Chat', icon: 'chat', path: '/chat' },
    { name: 'Workspace', icon: 'developer_mode', path: '/research-studio' },
  ];

  const supervisorItems = [
    { name: 'Overview', icon: 'dashboard', path: '/supervisor-dashboard' },
    { name: 'Supervised Projects', icon: 'folder_open', path: '/explore' },
    { name: 'Reviews', icon: 'rate_review', path: '/reviews' },
    { name: 'Students & Workload', icon: 'groups', path: '/team-management' },
    { name: 'Meetings', icon: 'event', path: '/meeting-management' },
    { name: 'Team Chat', icon: 'chat', path: '/chat' },
    { name: 'Workspace', icon: 'developer_mode', path: '/research-studio' },
  ];

  const adminItems = [
    { name: 'Overview', icon: 'dashboard', path: '/admin-dashboard' },
    { name: 'People', icon: 'manage_accounts', path: '/admin-management' },
    { name: 'Courses & Departments', icon: 'school', path: '/course-management' },
    { name: 'Projects & Supervision', icon: 'folder_open', path: '/explore' },
    { name: 'Policies & Reporting', icon: 'policy', path: '/plagiarism-checker' },
    { name: 'Settings', icon: 'settings', path: '/settings' },
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
            aria-label="Close navigation"
            className="md:hidden flex p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
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
                  aria-label={isCollapsed ? item.name : undefined}
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
