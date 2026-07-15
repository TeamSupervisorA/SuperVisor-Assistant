import React from 'react';

const TopNavbar = ({ onMenuClick }) => {
  return (
    <header className="flex justify-between items-center h-16 px-margin_mobile md:px-margin_desktop bg-surface-bright/80 backdrop-blur-md shrink-0 z-40 sticky top-0">
      <button 
        onClick={onMenuClick}
        className="md:hidden text-on-surface-variant p-2 rounded-full hover:bg-surface-container"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>
      
      <div className="font-headline-md text-[24px] font-black text-on-surface dark:text-inverse-on-surface hidden md:block">
        Academic Supervisor Assistant
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative hidden sm:flex items-center">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '20px' }}>search</span>
          <input 
            className="h-10 pl-10 pr-4 rounded-full bg-surface-container-low border border-outline-variant text-body-sm font-body-sm focus:outline-none focus-within:ring-2 focus-within:ring-primary w-64 transition-all" 
            placeholder="Search..." 
            type="text" 
          />
        </div>
        
        <button className="p-2 rounded-full text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim hover:bg-surface-container-low transition-colors duration-200 relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border border-surface-bright"></span>
        </button>
        
        <button className="p-2 rounded-full text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim hover:bg-surface-container-low transition-colors duration-200">
          <span className="material-symbols-outlined">chat_spark</span>
        </button>
        
        <button className="p-2 rounded-full text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim hover:bg-surface-container-low transition-colors duration-200 ml-2">
          <img 
            alt="Profile" 
            className="w-8 h-8 rounded-full border border-outline-variant" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuApRVaEza9QUVG9t7Wvl9Xbvher7TjPUuWs-sF6-x95MKxhQKObRAEhI03f-gz7soF0dv7QuXTt6j07bnjT0cd-lJSkGOJ8NXJdS-brX-QlH-8cHI6bQ3LkxkVDAWcT2SgjxDi_8Icm_28g0dS5SVjClkk0S0zUdqAndrvaIw0AJXITdNHWXLxM3oChYz2b4vNQbCJ50p8wnPkfpCH0fpe5RM540tcfaLG_MJ6388PfPoZTyU4r-5Uw3ADfKp2AKk5ROe_aiOOc5Og" 
          />
        </button>
      </div>
    </header>
  );
};

export default TopNavbar;
