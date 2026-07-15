import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Sidebar = ({ isCollapsed, toggleCollapse, closeMobile }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { name: 'Supervision', icon: 'supervisor_account', path: '/supervision' },
    { name: 'Explore Projects', icon: 'search', path: '/explore' },
    { name: 'Students', icon: 'school', path: '/students' },
    { name: 'Research', icon: 'menu_book', path: '/research' },
    { name: 'Resources', icon: 'library_books', path: '/resources' },
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-surface dark:bg-inverse-surface h-full flex flex-col border-r border-outline-variant shadow-sm z-50 overflow-hidden"
    >
      <div className="p-4 flex items-center justify-between border-b border-outline-variant/30 h-20 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="w-10 h-10 shrink-0 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-bold">
            <span className="material-symbols-outlined">school</span>
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-headline-md text-[20px] font-bold text-primary dark:text-primary-fixed leading-tight">Academic AI</h1>
            </motion.div>
          )}
        </div>
        
        <button 
          onClick={toggleCollapse} 
          className="hidden md:flex p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
        <button 
          onClick={closeMobile} 
          className="md:hidden flex p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>
      
      <div className="px-3 mt-6 shrink-0">
        <button className={`w-full bg-primary text-on-primary h-12 rounded-xl flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} font-label-md text-[13px] font-semibold hover:bg-primary-fixed-variant transition-colors shadow-sm`}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
          {!isCollapsed && <span>New Intervention</span>}
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <Link 
              key={item.name} 
              to={item.path} 
              onClick={closeMobile}
              title={isCollapsed ? item.name : ''}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 active:scale-95 ${isActive ? 'bg-primary/10 text-primary font-bold' : 'text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low hover:text-on-surface'}`}
            >
              <span className={`material-symbols-outlined ${isActive ? 'icon-fill' : ''}`}>{item.icon}</span>
              {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      
      <div className="px-3 py-4 border-t border-outline-variant/30 space-y-1 shrink-0">
        <Link to="#" className={`flex items-center gap-3 px-3 py-3 rounded-xl text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low transition-colors duration-200 active:scale-95`} title={isCollapsed ? "Help Center" : ""}>
          <span className="material-symbols-outlined">help</span>
          {!isCollapsed && <span className="whitespace-nowrap">Help Center</span>}
        </Link>
        <Link to="/" className={`flex items-center gap-3 px-3 py-3 rounded-xl text-secondary dark:text-secondary-fixed-dim hover:bg-error-container hover:text-error transition-colors duration-200 active:scale-95`} title={isCollapsed ? "Logout" : ""}>
          <span className="material-symbols-outlined">logout</span>
          {!isCollapsed && <span className="whitespace-nowrap">Logout</span>}
        </Link>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
