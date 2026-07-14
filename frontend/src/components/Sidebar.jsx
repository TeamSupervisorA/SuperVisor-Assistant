import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface dark:bg-inverse-surface flex-col border-r border-outline-variant shadow-sm z-50 hidden md:flex">
      <div className="p-6 flex items-center gap-3 border-b border-outline-variant/30">
        <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-bold">
          <span className="material-symbols-outlined">school</span>
        </div>
        <div>
          <h1 className="font-headline-md text-[24px] font-bold text-primary dark:text-primary-fixed leading-tight">Academic AI</h1>
          <p className="font-body-sm text-[14px] text-secondary">Supervision Suite</p>
        </div>
      </div>
      
      <div className="px-4 mt-6">
        <button className="w-full bg-primary text-on-primary h-10 rounded-lg flex items-center justify-center gap-2 font-label-md text-[12px] font-semibold hover:bg-primary-fixed-variant transition-colors shadow-sm">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Intervention
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
        <Link to="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 border-l-4 border-primary text-primary font-bold transition-colors duration-200 active:scale-95">
          <span className="material-symbols-outlined">dashboard</span>
          Dashboard
        </Link>
        <Link to="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low transition-colors duration-200 active:scale-95 border-l-4 border-transparent">
          <span className="material-symbols-outlined">supervisor_account</span>
          Supervision
        </Link>
        <Link to="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low transition-colors duration-200 active:scale-95 border-l-4 border-transparent">
          <span className="material-symbols-outlined">school</span>
          Students
        </Link>
        <Link to="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low transition-colors duration-200 active:scale-95 border-l-4 border-transparent">
          <span className="material-symbols-outlined">menu_book</span>
          Research
        </Link>
        <Link to="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low transition-colors duration-200 active:scale-95 border-l-4 border-transparent">
          <span className="material-symbols-outlined">library_books</span>
          Resources
        </Link>
        <Link to="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low transition-colors duration-200 active:scale-95 border-l-4 border-transparent">
          <span className="material-symbols-outlined">settings</span>
          Settings
        </Link>
      </nav>
      
      <div className="px-3 py-4 border-t border-outline-variant/30 space-y-1">
        <Link to="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low transition-colors duration-200 active:scale-95 border-l-4 border-transparent">
          <span className="material-symbols-outlined">help</span>
          Help Center
        </Link>
        <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low transition-colors duration-200 active:scale-95 border-l-4 border-transparent">
          <span className="material-symbols-outlined">logout</span>
          Logout
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
