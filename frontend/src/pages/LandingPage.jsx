import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/ThemeContext';

// --- Reusable Advanced Components ---

// Spotlight Card Component for Bento Grid
const SpotlightCard = ({ children, className = "" }) => {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = ({ currentTarget, clientX, clientY }) => {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-[32px] bg-surface/80 backdrop-blur-xl border border-outline-variant/30 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className}`}
      onMouseMove={handleMouseMove}
      ref={ref}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[32px] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(var(--color-primary-rgb), 0.1), transparent 40%)`
          ),
        }}
      />
      <div className="relative h-full w-full">{children}</div>
    </div>
  );
};

// Text Reveal Component (Staggered Characters/Words)
const TextReveal = ({ text, className, delay = 0 }) => {
  const words = text.split(" ");
  return (
    <div className={`flex flex-wrap justify-center ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: delay + i * 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="mr-3"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

// Advanced Mesh Gradient Background
const MeshGradient = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-background mix-blend-multiply opacity-50 dark:opacity-0"></div>
      <motion.div 
        animate={{ 
          rotate: 360,
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-primary/10 blur-[120px] origin-center"
      />
      <motion.div 
        animate={{ 
          rotate: -360,
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute top-[20%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-tertiary-container/15 blur-[120px] origin-center"
      />
      <motion.div 
        animate={{ 
          y: [0, -50, 0],
          x: [0, 50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-primary-fixed/20 blur-[100px] origin-center"
      />
      {/* Noise overlay for texture */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMSIvPjxwYXRoIGQ9Ik0wIDBoNHYxSDB6bTAgMmg0djFIMHoiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')]"></div>
    </div>
  );
};

// --- Main Page ---
const LandingPage = () => {
  const { isDark, toggleDark } = useTheme();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  
  // Interactive Role Toggle State
  const [activeRole, setActiveRole] = useState('supervisor');

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col overflow-hidden relative selection:bg-primary/20 selection:text-primary">
      <MeshGradient />

      {/* Modern Header */}
      <header className="bg-surface/60 backdrop-blur-2xl sticky top-0 z-50 px-margin_desktop h-20 flex justify-between items-center border-b border-outline-variant/10 transition-all">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-primary to-primary-fixed-variant flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <span aria-hidden="true" className="material-symbols-outlined text-on-primary icon-fill text-[20px]">school</span>
          </div>
          <span className="font-headline-md text-[22px] font-black tracking-tight text-on-surface">SuperVisor<span className="text-primary">.ai</span></span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4 sm:gap-6"
        >
          <button
            onClick={toggleDark}
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-surface-variant/50 transition-all duration-300 relative"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={isDark ? 'light' : 'dark'}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className="material-symbols-outlined text-[20px]"
              >
                {isDark ? 'light_mode' : 'dark_mode'}
              </motion.span>
            </AnimatePresence>
          </button>
          
          <div className="w-px h-5 bg-outline-variant/30 hidden sm:block"></div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login" className="font-label-md text-[14px] font-semibold text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2 rounded-full hover:bg-surface-variant/30 hidden sm:block">Sign In</Link>
            <Link to="/register" className="font-label-md text-[14px] font-semibold bg-on-surface text-surface px-6 py-2.5 rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(255,255,255,0.1)] relative overflow-hidden group">
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 hidden group-hover:inline ml-2 text-on-primary">→</span>
            </Link>
          </div>
        </motion.div>
      </header>
      
      <main className="flex-grow flex flex-col items-center z-10 relative">
        <div className="w-full max-w-container_max px-4 sm:px-8 lg:px-margin_desktop">
          
          {/* Hero Section */}
          <motion.section 
            style={{ y: heroY, opacity: heroOpacity }}
            className="pt-32 lg:pt-48 pb-20 flex flex-col items-center text-center relative"
          >
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface/40 border border-outline-variant/30 mb-10 backdrop-blur-xl shadow-sm"
            >
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border-2 border-surface"><span className="material-symbols-outlined text-[12px] text-primary">auto_awesome</span></div>
                <div className="w-6 h-6 rounded-full bg-tertiary-container/30 flex items-center justify-center border-2 border-surface"><span className="material-symbols-outlined text-[12px] text-tertiary">speed</span></div>
              </div>
              <span className="font-label-md font-semibold text-on-surface text-[13px] tracking-wide uppercase">Introducing Gemini 2.5 Flash Integration</span>
            </motion.div>

            <TextReveal 
              text="Elevate Academic"
              className="font-display text-[56px] sm:text-[72px] lg:text-[100px] leading-[1.05] font-black text-on-surface tracking-tighter" 
            />
            <TextReveal 
              text="Supervision & Research"
              delay={0.2}
              className="font-display text-[56px] sm:text-[72px] lg:text-[100px] leading-[1.05] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-tertiary to-primary bg-[length:200%_auto] animate-gradient pb-2" 
            />
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-body-lg text-[20px] lg:text-[24px] text-on-surface-variant max-w-3xl mb-12 mt-8 leading-relaxed font-light"
            >
              The intelligent OS for academic projects. Streamline workflows, ensure integrity, and provide actionable feedback with institutional-grade AI.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-5"
            >
              <Link to="/register" className="group font-label-lg text-[16px] font-bold bg-on-surface text-surface px-8 py-4 rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(53,37,205,0.4)] hover:scale-105 flex items-center justify-center gap-3 relative overflow-hidden">
                <span className="relative z-10">Start Building the Future</span>
                <span className="material-symbols-outlined relative z-10 transition-transform group-hover:translate-x-1 text-[20px]">arrow_forward</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
              <button className="group font-label-lg text-[16px] font-bold text-on-surface bg-surface/50 backdrop-blur-md border border-outline-variant/40 px-8 py-4 rounded-full hover:bg-surface-variant/50 transition-all duration-300 flex items-center justify-center gap-3">
                <span className="material-symbols-outlined icon-fill text-on-surface-variant group-hover:text-primary transition-colors">play_circle</span>
                Watch Platform Demo
              </button>
            </motion.div>
          </motion.section>

          {/* Hero Dashboard Preview Image (Placeholder abstract visualization) */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
            className="w-full max-w-5xl mx-auto mb-40 perspective-[2000px]"
          >
            <div className="rounded-[24px] overflow-hidden border border-outline-variant/20 shadow-[0_30px_100px_-20px_rgba(53,37,205,0.25)] bg-surface-container/50 backdrop-blur-xl aspect-video relative rotate-x-[5deg] scale-95 hover:rotate-x-0 hover:scale-100 transition-all duration-700 ease-out flex flex-col">
              {/* Fake Mac Header */}
              <div className="h-12 border-b border-outline-variant/20 flex items-center px-4 gap-2 bg-surface/50">
                <div className="w-3 h-3 rounded-full bg-error/80"></div>
                <div className="w-3 h-3 rounded-full bg-secondary-fixed-dim/80"></div>
                <div className="w-3 h-3 rounded-full bg-tertiary-fixed-dim/80"></div>
              </div>
              <div className="flex-1 p-8 grid grid-cols-3 gap-6 opacity-80">
                <div className="col-span-1 space-y-4">
                  <div className="h-32 rounded-2xl bg-surface-variant/30 border border-outline-variant/10"></div>
                  <div className="h-64 rounded-2xl bg-surface-variant/30 border border-outline-variant/10"></div>
                </div>
                <div className="col-span-2 space-y-4">
                  <div className="h-16 rounded-2xl bg-primary/10 border border-primary/20"></div>
                  <div className="h-80 rounded-2xl bg-surface-variant/30 border border-outline-variant/10 flex items-center justify-center">
                    <span className="font-display text-4xl text-on-surface-variant/30 font-black tracking-widest uppercase">SuperVisor Dashboard</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bento Grid Feature Section */}
          <section className="py-24 relative z-20">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-[40px] md:text-[56px] font-black text-on-surface mb-6 tracking-tight leading-tight">
                Supervision, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">Evolved.</span>
              </h2>
              <p className="font-body-lg text-[20px] text-on-surface-variant max-w-2xl mx-auto font-light">Everything you need to guide students from proposal to final defense, unified in one intelligent platform.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[300px]">
              
              {/* Feature 1: Large Span */}
              <SpotlightCard className="md:col-span-2 lg:col-span-2 row-span-2 p-10 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">psychology</span>
                  </div>
                  <h3 className="font-headline-md text-[28px] font-bold text-on-surface mb-4 tracking-tight">AI-Powered Insights</h3>
                  <p className="font-body-md text-[16px] text-on-surface-variant max-w-md leading-relaxed">
                    Intelligent guidance tailored to individual research paths. The AI analyzes proposals, suggests methodologies, and highlights academic gaps in real-time.
                  </p>
                </div>
                
                <div className="mt-8 bg-surface-container-lowest/80 p-6 rounded-2xl border border-outline-variant/20 shadow-inner relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                  <div className="flex items-start gap-4">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary text-xl mt-0.5 animate-pulse">auto_awesome</span>
                    <div>
                      <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-2 text-[11px] font-bold">AI Suggestion</p>
                      <p className="font-body-sm text-[15px] text-on-surface">
                        "The literature review lacks recent sources on machine learning applied to fluid dynamics. Consider referencing [Author, 2024]."
                      </p>
                    </div>
                  </div>
                </div>
              </SpotlightCard>

              {/* Feature 2: Square */}
              <SpotlightCard className="md:col-span-1 lg:col-span-2 p-8">
                <div className="w-14 h-14 rounded-2xl bg-tertiary-container/20 flex items-center justify-center mb-6 border border-tertiary-container/30">
                  <span aria-hidden="true" className="material-symbols-outlined text-tertiary-container text-2xl">timeline</span>
                </div>
                <h3 className="font-title-lg text-[22px] font-bold text-on-surface mb-3 tracking-tight">Milestone Tracking</h3>
                <p className="font-body-sm text-[15px] text-on-surface-variant leading-relaxed mb-6">Real-time monitoring of deliverables to ensure projects stay exactly on schedule.</p>
                <div className="w-full bg-secondary-container h-2 rounded-full overflow-hidden mt-auto">
                  <motion.div 
                    initial={{ width: 0 }} 
                    whileInView={{ width: "75%" }} 
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    className="bg-tertiary h-full rounded-full relative"
                  />
                </div>
              </SpotlightCard>

              {/* Feature 3: Square */}
              <SpotlightCard className="md:col-span-1 lg:col-span-1 p-8 bg-surface-container-low/50">
                <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center mb-6 border border-error/20">
                  <span aria-hidden="true" className="material-symbols-outlined text-error text-2xl">policy</span>
                </div>
                <h3 className="font-title-lg text-[22px] font-bold text-on-surface mb-3 tracking-tight">Integrity Check</h3>
                <p className="font-body-sm text-[15px] text-on-surface-variant leading-relaxed">Deep semantic analysis against institutional databases for original thought.</p>
              </SpotlightCard>

              {/* Feature 4: Square */}
              <SpotlightCard className="md:col-span-2 lg:col-span-1 p-8">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 border border-secondary/20">
                  <span aria-hidden="true" className="material-symbols-outlined text-secondary text-2xl">forum</span>
                </div>
                <h3 className="font-title-lg text-[22px] font-bold text-on-surface mb-3 tracking-tight">Contextual Chat</h3>
                <p className="font-body-sm text-[15px] text-on-surface-variant leading-relaxed">Project-specific communication channels linked directly to deliverables.</p>
              </SpotlightCard>

              {/* Feature 5: Wide Bottom Span */}
              <SpotlightCard className="md:col-span-3 lg:col-span-4 p-10 flex flex-col md:flex-row gap-10 items-center overflow-hidden">
                <div className="flex-1 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center mb-6 border border-primary-container/30">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">rate_review</span>
                  </div>
                  <h3 className="font-headline-md text-[28px] font-bold text-on-surface mb-4 tracking-tight">Structured Feedback Loop</h3>
                  <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed max-w-xl">
                    Evaluation rubrics combined with AI-assisted drafting allow supervisors to provide comprehensive, actionable critiques up to 3x faster, without sacrificing quality.
                  </p>
                </div>
                
                {/* Abstract visualization of feedback */}
                <div className="flex-1 w-full relative h-[150px] md:h-full min-h-[150px]">
                  <motion.div 
                    initial={{ x: 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-full max-w-md bg-surface-lowest rounded-2xl p-5 shadow-xl border border-outline-variant/20 z-10"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[12px] font-bold">DR</div>
                      <div className="flex-1 h-2 bg-surface-variant rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-outline-variant/30 rounded-full w-full"></div>
                      <div className="h-2 bg-outline-variant/30 rounded-full w-4/5"></div>
                      <div className="h-2 bg-primary/20 rounded-full w-3/5"></div>
                    </div>
                  </motion.div>
                </div>
              </SpotlightCard>
            </div>
          </section>

          {/* Interactive "Built for Everyone" Section */}
          <section className="py-32 relative z-20">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-display text-[40px] md:text-[56px] font-black text-on-surface mb-6 tracking-tight">
                Designed for <span className="text-primary">Impact.</span>
              </h2>
              <p className="font-body-md text-[20px] text-on-surface-variant max-w-2xl mx-auto font-light mb-12">
                Tailored interfaces designed specifically for the unique workflows of educators and researchers.
              </p>
              
              {/* Custom Toggle */}
              <div className="inline-flex bg-surface-variant/30 p-1.5 rounded-full backdrop-blur-md border border-outline-variant/20 relative">
                <div 
                  className="absolute inset-y-1.5 left-1.5 bg-surface rounded-full shadow-sm transition-all duration-300 ease-out z-0"
                  style={{ 
                    width: 'calc(50% - 6px)',
                    transform: activeRole === 'student' ? 'translateX(calc(100% + 12px))' : 'translateX(0)'
                  }}
                ></div>
                <button 
                  onClick={() => setActiveRole('supervisor')}
                  className={`relative z-10 px-8 py-3 rounded-full font-label-lg text-[15px] font-bold transition-colors duration-300 ${activeRole === 'supervisor' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  For Supervisors
                </button>
                <button 
                  onClick={() => setActiveRole('student')}
                  className={`relative z-10 px-8 py-3 rounded-full font-label-lg text-[15px] font-bold transition-colors duration-300 ${activeRole === 'student' ? 'text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  For Students
                </button>
              </div>
            </motion.div>
            
            <div className="max-w-5xl mx-auto min-h-[400px]">
              <AnimatePresence mode="wait">
                {activeRole === 'supervisor' ? (
                  <motion.div
                    key="supervisor"
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                    transition={{ duration: 0.4 }}
                    className="bg-surface-container-lowest rounded-[40px] p-12 border border-outline-variant/20 shadow-2xl flex flex-col md:flex-row gap-12 items-center"
                  >
                    <div className="flex-1">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-8 text-on-primary shadow-lg shadow-primary/30">
                        <span aria-hidden="true" className="material-symbols-outlined text-3xl icon-fill">supervisor_account</span>
                      </div>
                      <h3 className="font-headline-lg text-[36px] font-black text-on-surface mb-6 tracking-tight">Scale your mentorship.</h3>
                      <p className="font-body-lg text-[18px] text-on-surface-variant leading-relaxed mb-8">
                        Manage dozens of projects simultaneously without dropping the ball. The dashboard highlights projects requiring attention, while AI assists in drafting comprehensive, rubric-aligned feedback.
                      </p>
                      <ul className="space-y-4">
                        {['Centralized project tracking', 'AI-assisted rubric grading', 'Automated milestone reminders'].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-on-surface font-medium">
                            <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex-1 w-full bg-surface-variant/20 rounded-[24px] h-[350px] border border-outline-variant/10 flex items-center justify-center overflow-hidden relative">
                       {/* Placeholder for UI graphic */}
                       <div className="absolute inset-8 border border-primary/20 rounded-xl bg-surface/50 backdrop-blur-sm p-4">
                          <div className="h-4 w-1/3 bg-primary/20 rounded mb-6"></div>
                          <div className="space-y-3">
                            <div className="h-12 w-full bg-surface rounded flex items-center px-4 border border-outline-variant/10"><div className="h-2 w-1/4 bg-error/40 rounded"></div></div>
                            <div className="h-12 w-full bg-surface rounded flex items-center px-4 border border-outline-variant/10"><div className="h-2 w-1/2 bg-tertiary/40 rounded"></div></div>
                            <div className="h-12 w-full bg-surface rounded flex items-center px-4 border border-outline-variant/10"><div className="h-2 w-1/3 bg-secondary/40 rounded"></div></div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="student"
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                    transition={{ duration: 0.4 }}
                    className="bg-surface-container-lowest rounded-[40px] p-12 border border-outline-variant/20 shadow-2xl flex flex-col md:flex-row gap-12 items-center"
                  >
                     <div className="flex-1 w-full bg-surface-variant/20 rounded-[24px] h-[350px] border border-outline-variant/10 flex items-center justify-center overflow-hidden relative order-2 md:order-1">
                        {/* Placeholder for UI graphic */}
                       <div className="absolute inset-8 border border-tertiary/20 rounded-xl bg-surface/50 backdrop-blur-sm p-6 flex flex-col">
                          <div className="h-8 w-1/2 bg-tertiary/20 rounded-full mb-auto"></div>
                          <div className="h-32 w-full bg-surface rounded-xl border border-outline-variant/20 p-4 mt-6">
                             <div className="flex gap-2 mb-4"><div className="w-8 h-8 rounded-full bg-primary/20"></div><div className="h-2 w-20 bg-surface-variant mt-2 rounded"></div></div>
                             <div className="h-2 w-full bg-outline-variant/20 rounded mb-2"></div>
                             <div className="h-2 w-4/5 bg-outline-variant/20 rounded"></div>
                          </div>
                       </div>
                     </div>
                    <div className="flex-1 order-1 md:order-2">
                      <div className="w-16 h-16 rounded-full bg-tertiary flex items-center justify-center mb-8 text-on-primary shadow-lg shadow-tertiary/30">
                        <span aria-hidden="true" className="material-symbols-outlined text-3xl icon-fill">school</span>
                      </div>
                      <h3 className="font-headline-lg text-[36px] font-black text-on-surface mb-6 tracking-tight">Focus on research.</h3>
                      <p className="font-body-lg text-[18px] text-on-surface-variant leading-relaxed mb-8">
                        Receive structured guidance, organize citations, manage versions, and submit deliverables through a stress-free, beautiful portal designed to reduce cognitive load.
                      </p>
                      <ul className="space-y-4">
                        {['Clear milestone expectations', 'Direct contextual communication', 'Automated formatting checks'].map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-on-surface font-medium">
                            <span className="material-symbols-outlined text-tertiary text-xl">check_circle</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="py-32 mb-20 relative z-20">
            <div className="bg-gradient-to-br from-primary to-tertiary-container rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[50px]"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[50px]"></div>
              
              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="font-display text-[40px] md:text-[56px] font-black text-white mb-6 tracking-tight leading-tight">
                  Ready to transform your academic workflow?
                </h2>
                <p className="font-body-lg text-[20px] text-white/80 mb-10 font-light">
                  Join hundreds of institutions already using SuperVisor.ai to elevate their research output.
                </p>
                <Link to="/register" className="inline-flex font-label-lg text-[18px] font-bold bg-white text-primary px-10 py-5 rounded-full hover:scale-105 transition-all duration-300 shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-black/30 items-center justify-center gap-2">
                  Get Started for Free
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Modern Footer */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/10 pt-20 pb-10 relative z-20">
        <div className="w-full max-w-container_max px-margin_desktop mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-4 mb-20">
            <div className="col-span-1 md:col-span-4 lg:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden="true" className="material-symbols-outlined text-primary text-3xl icon-fill">school</span>
                <span className="font-headline-md text-[24px] font-black tracking-tight text-on-surface">SuperVisor<span className="text-primary">.ai</span></span>
              </div>
              <p className="font-body-md text-[16px] text-on-surface-variant max-w-sm leading-relaxed mb-8 font-light">
                Elevating academic research and supervision through intelligent, institutional-grade technology.
              </p>
            </div>
            
            <div className="col-span-1 md:col-span-2 lg:col-span-2 md:col-start-7 lg:col-start-7">
              <h4 className="font-label-lg text-[14px] font-bold text-on-surface uppercase tracking-wider mb-6">Product</h4>
              <ul className="space-y-4 font-body-sm text-[15px] text-on-surface-variant">
                <li><a className="hover:text-primary transition-colors block" href="#">Features</a></li>
                <li><a className="hover:text-primary transition-colors block" href="#">Integrations</a></li>
                <li><a className="hover:text-primary transition-colors block" href="#">Pricing</a></li>
                <li><a className="hover:text-primary transition-colors block" href="#">Changelog</a></li>
              </ul>
            </div>
            
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <h4 className="font-label-lg text-[14px] font-bold text-on-surface uppercase tracking-wider mb-6">Company</h4>
              <ul className="space-y-4 font-body-sm text-[15px] text-on-surface-variant">
                <li><a className="hover:text-primary transition-colors block" href="#">About Us</a></li>
                <li><a className="hover:text-primary transition-colors block" href="#">Careers</a></li>
                <li><a className="hover:text-primary transition-colors block" href="#">Blog</a></li>
                <li><a className="hover:text-primary transition-colors block" href="#">Contact</a></li>
              </ul>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <h4 className="font-label-lg text-[14px] font-bold text-on-surface uppercase tracking-wider mb-6">Legal</h4>
              <ul className="space-y-4 font-body-sm text-[15px] text-on-surface-variant">
                <li><a className="hover:text-primary transition-colors block" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-primary transition-colors block" href="#">Terms of Service</a></li>
                <li><a className="hover:text-primary transition-colors block" href="#">Data Processing</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-outline-variant/20 pt-8 flex flex-col md:flex-row justify-between items-center font-body-sm text-[14px] text-on-surface-variant">
            <p>© 2026 SuperVisor.ai. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">public</span></a>
              <a href="#" className="hover:text-primary transition-colors"><span className="material-symbols-outlined text-[20px]">mail</span></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
