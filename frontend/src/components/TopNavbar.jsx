import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import API_BASE_URL, { apiFetch } from '../lib/api';

const TopNavbar = ({ onMenuClick, isDark, toggleDark }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [myProjects, setMyProjects] = useState([]);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const projectSelectorRef = useRef(null);

  const navigate = useNavigate();
  const { user, token, logout, activeProject, setActiveProject } = useAuth();

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) setNotifications(json.data);
      } catch (e) {
        // Silent fail — notifications are non-critical
      }
    };
    
    const loadProjects = async () => {
      try {
        if (!token) return;
        const res = await apiFetch('/api/projects');
        if (res.data) {
          setMyProjects(res.data);
          // Auto-select first project if none is active
          if (res.data.length > 0 && !activeProject) {
            setActiveProject(res.data[0]);
          } else if (activeProject) {
            // Update active project with fresh data if it exists in the list
            const updatedProject = res.data.find(p => p._id === activeProject._id);
            if (updatedProject) setActiveProject(updatedProject);
          }
        }
      } catch (e) {
        console.error("Failed to load user projects");
      }
    };

    loadNotifications();
    loadProjects();
  }, [token]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifPanel(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
      if (projectSelectorRef.current && !projectSelectorRef.current.contains(e.target)) setShowProjectSelector(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await apiFetch(`/api/notifications/${notifId}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
    } catch (e) {
      // Optimistic — just mark locally
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/');
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const notifIcons = {
    info: 'info',
    warning: 'warning',
    success: 'check_circle',
    error: 'error',
    default: 'notifications',
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <header className="flex justify-between items-center h-16 px-4 md:px-8 bg-surface/80 backdrop-blur-xl shrink-0 z-40 sticky top-0 border-b border-outline-variant/20">
      <button 
        onClick={onMenuClick}
        className="md:hidden text-on-surface-variant p-2 rounded-full hover:bg-surface-container transition-colors"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Global Project Selector */}
      <div className="relative ml-2 mr-auto" ref={projectSelectorRef}>
        <button 
          onClick={() => setShowProjectSelector(!showProjectSelector)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-container transition-colors max-w-[200px] md:max-w-[300px]"
        >
          <span className="material-symbols-outlined text-primary text-[20px]">folder_open</span>
          <div className="flex flex-col text-left min-w-0">
            <span className="font-label-sm text-[10px] text-secondary uppercase tracking-wider leading-tight">Active Context</span>
            <span className="font-label-md text-[14px] font-bold text-on-surface truncate leading-tight">
              {activeProject ? activeProject.title : (myProjects.length === 0 ? 'No Projects' : 'Select Project')}
            </span>
          </div>
          <span className="material-symbols-outlined text-outline text-[18px]">expand_more</span>
        </button>

        <AnimatePresence>
          {showProjectSelector && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-full mt-2 w-72 bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-96"
            >
              <div className="px-4 py-3 border-b border-outline-variant/20 bg-surface-container-lowest">
                <h3 className="font-label-md font-bold text-on-surface">Your Projects</h3>
              </div>
              <div className="overflow-y-auto p-2 space-y-1">
                {myProjects.length === 0 ? (
                  <p className="p-3 text-[13px] text-secondary text-center">You have no active projects.</p>
                ) : (
                  myProjects.map(proj => (
                    <button
                      key={proj._id}
                      onClick={() => { setActiveProject(proj); setShowProjectSelector(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-colors ${activeProject?._id === proj._id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'}`}
                    >
                      <span className="material-symbols-outlined text-[18px] shrink-0">
                        {activeProject?._id === proj._id ? 'check_circle' : 'work'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`font-label-md text-[13px] font-semibold truncate ${activeProject?._id === proj._id ? 'text-primary' : 'text-on-surface'}`}>{proj.title}</p>
                        <p className="font-label-md text-[11px] text-secondary capitalize">{proj.status.replace('_', ' ')}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="px-2 py-2 border-t border-outline-variant/20 bg-surface-container-lowest">
                <button
                  onClick={() => { setShowProjectSelector(false); navigate('/create-new-work'); }}
                  className="w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 hover:bg-surface-container-low transition-colors text-primary"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span className="font-label-md text-[13px] font-semibold">Propose New Work</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Search */}
      <form onSubmit={handleSearch} className="relative hidden lg:flex items-center ml-4">
        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[20px]">search</span>
        <input 
          className="h-10 pl-11 pr-4 rounded-full bg-surface-container-highest/60 border border-transparent text-[14px] focus:outline-none focus:bg-surface focus:border-primary/30 w-64 lg:w-80 transition-all focus:ring-2 focus:ring-primary/10 placeholder:text-outline" 
          placeholder="Search projects, tasks..." 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>
      
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifPanel(!showNotifPanel); setShowUserMenu(false); }}
            className="p-2.5 rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors duration-200 relative group"
          >
            <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface shadow-sm animate-pulse"></span>
            )}
          </button>

          {/* Notification Dropdown */}
          <AnimatePresence>
            {showNotifPanel && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                  <div>
                    <h3 className="font-title-lg text-[16px] font-bold text-on-surface">Notifications</h3>
                    {unreadCount > 0 && (
                      <p className="font-label-md text-[12px] text-primary">{unreadCount} unread</p>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="font-label-md text-[12px] font-semibold text-primary hover:text-surface-tint transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <span className="material-symbols-outlined text-on-surface-variant/30 text-[40px]">notifications_off</span>
                      <p className="font-body-sm text-[14px] text-secondary">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((notif, idx) => (
                      <button
                        key={notif._id || idx}
                        onClick={() => { markAsRead(notif._id); }}
                        className={`w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-surface-container-low transition-colors border-b border-outline-variant/10 last:border-none ${!notif.isRead ? 'bg-primary/3' : ''}`}
                      >
                        <span className={`material-symbols-outlined text-[20px] mt-0.5 shrink-0 ${!notif.isRead ? 'text-primary' : 'text-outline'}`}>
                          {notifIcons[notif.type] || notifIcons.default}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-body-sm text-[13px] leading-snug ${!notif.isRead ? 'text-on-surface font-semibold' : 'text-secondary'}`}>
                            {notif.message || notif.title || 'New notification'}
                          </p>
                          <p className="font-label-md text-[11px] text-outline mt-1">{timeAgo(notif.createdAt)}</p>
                        </div>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5"></span>
                        )}
                      </button>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="px-5 py-3 border-t border-outline-variant/20 text-center">
                    <button
                      onClick={() => { setShowNotifPanel(false); navigate('/settings'); }}
                      className="font-label-md text-[13px] font-semibold text-primary hover:text-surface-tint transition-colors"
                    >
                      View All Notifications
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* User Avatar & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifPanel(false); }}
            className="ml-2 flex items-center gap-2.5 px-2 py-1.5 rounded-full hover:bg-surface-container transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-fixed-variant flex items-center justify-center text-on-primary font-bold text-[13px] shadow-sm group-hover:shadow-md transition-shadow">
              {userInitial}
            </div>
            <div className="hidden lg:block text-left">
              <p className="font-label-md text-[13px] font-semibold text-on-surface leading-tight truncate max-w-[120px]">{user?.name || 'User'}</p>
              <p className="font-label-md text-[11px] text-outline capitalize">{user?.role || 'student'}</p>
            </div>
            <span className="material-symbols-outlined text-[18px] text-outline hidden lg:block">expand_more</span>
          </button>

          {/* User Dropdown Menu */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-full mt-2 w-64 bg-surface border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                {/* User Info */}
                <div className="px-5 py-4 border-b border-outline-variant/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-fixed-variant flex items-center justify-center text-on-primary font-bold text-[15px]">
                      {userInitial}
                    </div>
                    <div className="min-w-0">
                      <p className="font-label-md text-[14px] font-bold text-on-surface truncate">{user?.name || 'User'}</p>
                      <p className="font-label-md text-[12px] text-outline truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  {[
                    { icon: 'person', label: 'My Profile', action: () => { setShowUserMenu(false); navigate('/settings'); } },
                    { icon: 'settings', label: 'Settings', action: () => { setShowUserMenu(false); navigate('/settings'); } },
                    { icon: isDark ? 'light_mode' : 'dark_mode', label: isDark ? 'Light Mode' : 'Dark Mode', action: () => { toggleDark(); } },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={item.action}
                      className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant text-[20px]">{item.icon}</span>
                      <span className="font-body-sm text-[14px] text-on-surface">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Logout */}
                <div className="border-t border-outline-variant/20 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-error-container transition-colors group"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-error text-[20px] transition-colors">logout</span>
                    <span className="font-body-sm text-[14px] text-on-surface group-hover:text-error transition-colors">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
