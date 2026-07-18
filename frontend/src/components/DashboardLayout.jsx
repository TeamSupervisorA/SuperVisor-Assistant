import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const { isDark, toggleDark } = useTheme();

  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex overflow-hidden">
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
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out z-50 md:flex flex-shrink-0`}>
        <Sidebar 
          isCollapsed={isDesktopCollapsed} 
          toggleCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)} 
          closeMobile={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Toggle Collapse Button */}
        <button 
          onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
          className="hidden md:flex absolute top-[28px] -right-3 w-6 h-6 rounded-full bg-surface border border-outline-variant/30 text-on-surface-variant hover:text-primary items-center justify-center shadow-sm hover:shadow hover:scale-105 active:scale-95 transition-all z-[60] cursor-pointer"
          title={isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="material-symbols-outlined text-[16px] font-bold">
            {isDesktopCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <TopNavbar
          onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isDark={isDark}
          toggleDark={toggleDark}
        />

        <main className="flex-1 overflow-y-auto w-full relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
