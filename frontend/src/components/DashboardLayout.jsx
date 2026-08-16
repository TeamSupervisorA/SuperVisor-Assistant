import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

const DashboardLayout = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopPinnedOpen, setIsDesktopPinnedOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches);
  const { isDark, toggleDark } = useTheme();
  const isDesktopCollapsed = isDesktop && !isDesktopPinnedOpen && !isSidebarHovered;
  const isPaperEditor = location.pathname.startsWith('/paper-editor');

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return (
    <div className="bg-background text-on-surface font-body-md antialiased flex h-dvh min-h-0 overflow-hidden">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-40 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar */}
      <div onMouseEnter={() => setIsSidebarHovered(true)} onMouseLeave={() => setIsSidebarHovered(false)} className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-50 md:flex flex-shrink-0`}>
        <Sidebar 
          isCollapsed={isDesktopCollapsed} 
          toggleCollapse={() => setIsDesktopPinnedOpen(!isDesktopPinnedOpen)}
          closeMobile={() => setIsMobileMenuOpen(false)}
        />
      </div>

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isDark={isDark}
          toggleDark={toggleDark}
        />

        <main className={`relative min-h-0 w-full flex-1 ${isPaperEditor ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
