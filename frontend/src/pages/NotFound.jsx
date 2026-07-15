import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 mx-auto rounded-2xl bg-surface-container flex items-center justify-center mb-8"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-[48px]">explore_off</span>
        </motion.div>
        
        <h1 className="font-display text-[72px] font-black text-primary leading-none mb-2">404</h1>
        <h2 className="font-headline-md text-[24px] font-bold text-on-surface mb-4">Page Not Found</h2>
        <p className="font-body-md text-[16px] text-secondary mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link 
            to="/dashboard" 
            className="bg-primary text-on-primary px-6 py-3 rounded-xl font-label-md text-[14px] font-semibold hover:bg-surface-tint transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Go to Dashboard
          </Link>
          <Link 
            to="/" 
            className="bg-surface-container text-on-surface px-6 py-3 rounded-xl font-label-md text-[14px] font-semibold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
