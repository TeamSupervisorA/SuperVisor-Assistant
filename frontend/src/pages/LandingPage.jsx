import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';
import BrandLogo from '../components/BrandLogo';

// --- Reusable Advanced Components ---

const SpotlightCard = ({ children, className = "" }) => {
  const ref = useRef(null);
  
  // Spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Tilt
  const xPct = useMotionValue(0);
  const yPct = useMotionValue(0);
  const mouseXSpring = useSpring(xPct, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(yPct, { stiffness: 300, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mX = e.clientX - rect.left;
    const mY = e.clientY - rect.top;
    
    mouseX.set(mX);
    mouseY.set(mY);
    
    xPct.set(mX / width - 0.5);
    yPct.set(mY / height - 0.5);
  };

  const handleMouseLeave = () => {
    xPct.set(0);
    yPct.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`group relative rounded-[32px] bg-surface/80 backdrop-blur-xl border border-outline-variant/30 shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${className}`}
    >
      {/* 3D Content Container */}
      <div style={{ transform: "translateZ(30px)" }} className="relative h-full w-full rounded-[32px] overflow-hidden">
        {/* Spotlight Effect */}
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
    </motion.div>
  );
};

const ResearchSignalMap = () => {
  const signals = [
    { label: 'Proposal', detail: 'Scope aligned', icon: 'description', position: 'lg:left-5 lg:top-20' },
    { label: 'Evidence', detail: 'Sources verified', icon: 'menu_book', position: 'lg:right-5 lg:top-20' },
    { label: 'Methods', detail: 'Review ready', icon: 'science', position: 'lg:left-5 lg:bottom-20' },
    { label: 'Integrity', detail: 'Checks recorded', icon: 'verified_user', position: 'lg:right-5 lg:bottom-20' }
  ];

  return (
    <div className="relative overflow-hidden rounded-[34px] border border-outline-variant/30 bg-surface/75 p-5 shadow-[0_30px_90px_-35px_rgba(53,37,205,.45)] backdrop-blur-2xl sm:p-7 dark:bg-surface/55">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22] dark:opacity-[0.12]"
        style={{ backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/15" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/30" />
      <motion.div
        aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        className="pointer-events-none absolute left-1/2 top-1/2 hidden h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full lg:block"
      >
        <span className="absolute left-1/2 top-[-5px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-tertiary shadow-[0_0_20px_rgba(88,80,255,.8)]" />
      </motion.div>

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Guidance graph</p>
          <p className="mt-1 text-xs text-on-surface-variant">Every decision stays connected.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live context
        </span>
      </div>

      <div className="relative z-10 mt-7 grid min-h-[350px] grid-cols-2 content-between gap-3 lg:block">
        {signals.map((signal, index) => (
          <motion.div
            key={signal.label}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1, y: [0, index % 2 ? -5 : 5, 0] }}
            transition={{ opacity: { delay: 0.35 + index * 0.1 }, scale: { delay: 0.35 + index * 0.1 }, y: { duration: 4 + index, repeat: Infinity, ease: 'easeInOut' } }}
            className={`rounded-2xl border border-outline-variant/30 bg-surface/90 p-3 shadow-lg backdrop-blur-xl lg:absolute lg:w-[150px] ${signal.position}`}
          >
            <span className="material-symbols-outlined text-[18px] text-primary">{signal.icon}</span>
            <p className="mt-2 text-xs font-extrabold text-on-surface">{signal.label}</p>
            <p className="mt-0.5 text-[10px] text-on-surface-variant">{signal.detail}</p>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-2 mx-auto my-3 flex h-32 w-32 flex-col items-center justify-center rounded-[32px] border border-primary/25 bg-gradient-to-br from-primary to-tertiary text-center text-on-primary shadow-[0_20px_50px_-15px_rgba(53,37,205,.65)] lg:absolute lg:left-1/2 lg:top-1/2 lg:my-0 lg:-translate-x-1/2 lg:-translate-y-1/2"
        >
          <span className="material-symbols-outlined text-[26px]">hub</span>
          <span className="mt-2 text-[10px] font-black uppercase tracking-[0.16em]">Research</span>
          <span className="text-[10px] text-on-primary/75">in motion</span>
        </motion.div>
      </div>

      <div className="relative z-10 mt-3 flex items-center justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-low/80 px-4 py-3 text-[10px] font-bold text-on-surface-variant">
        <span>Student work</span><span className="material-symbols-outlined text-[15px] text-primary">sync_alt</span><span>Supervisor decision</span><span className="material-symbols-outlined text-[15px] text-primary">sync_alt</span><span>Admin oversight</span>
      </div>
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
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col overflow-hidden relative selection:bg-primary/20 selection:text-primary scroll-smooth">
      <MeshGradient />

      {/* Modern Header */}
      <header className="bg-surface/60 backdrop-blur-2xl sticky top-0 z-50 px-margin_desktop h-20 flex justify-between items-center border-b border-outline-variant/10 transition-all">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 group cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="flex h-11 w-[210px] items-center justify-center rounded-[14px] border border-outline-variant/30 bg-white px-3 py-2 shadow-lg shadow-primary/10 transition-transform group-hover:scale-[1.02] dark:border-white/10 dark:bg-[#11131a] dark:shadow-primary/20">
            <BrandLogo className="h-auto w-full" />
          </div>
        </motion.div>

        {/* Central Navigation */}
        <motion.nav 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 bg-surface-variant/30 px-6 py-2.5 rounded-full backdrop-blur-md border border-outline-variant/20 shadow-sm"
        >
          <a href="#features" className="font-label-md text-[14px] font-semibold text-on-surface-variant hover:text-primary transition-colors">Features</a>
          <a href="#audience" className="font-label-md text-[14px] font-semibold text-on-surface-variant hover:text-primary transition-colors">Audience</a>
          <Link to="/privacy" className="font-label-md text-[14px] font-semibold text-on-surface-variant hover:text-primary transition-colors">Privacy</Link>
        </motion.nav>
        
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
            <Link to="/login" className="font-label-md text-[14px] font-semibold text-on-surface-variant hover:text-on-surface transition-colors px-3 py-2 rounded-full hover:bg-surface-variant/30">Sign In</Link>
            <Link to="/register" className="font-label-md text-[14px] font-semibold bg-on-surface text-surface px-6 py-2.5 rounded-full hover:scale-105 transition-transform duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_rgba(255,255,255,0.1)] relative overflow-hidden group">
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 hidden group-hover:inline ml-2 text-on-primary">→</span>
            </Link>
            <button className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-variant/30 ml-2">
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </motion.div>
      </header>
      
      <main className="flex-grow flex flex-col items-center z-10 relative">
        <div className="w-full max-w-container_max px-4 sm:px-8 lg:px-margin_desktop">
          
          {/* Hero Section */}
          <motion.section 
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative grid min-h-[760px] items-center gap-16 pb-24 pt-20 lg:grid-cols-[1.06fr_.94fr] lg:pb-32 lg:pt-28"
          >
            <div className="relative z-10 max-w-3xl text-left">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-primary"
              >
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_16px_rgba(83,68,255,.8)]" />
                One connected academic record
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[52px] font-black leading-[0.98] tracking-[-0.055em] text-on-surface sm:text-[72px] lg:text-[82px]"
              >
                Research moves when <span className="bg-gradient-to-r from-[#087ea4] via-primary to-tertiary bg-clip-text text-transparent">guidance connects.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="mt-8 max-w-2xl text-[18px] font-light leading-relaxed text-on-surface-variant lg:text-[21px]"
              >
                Supervisor Assistant links student work, evidence, feedback, integrity checks, and institutional oversight—so the next academic decision is always clear.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.48 }}
                className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center"
              >
                <Link to="/register" className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-on-surface px-8 py-4 text-[15px] font-bold text-surface shadow-[0_16px_45px_-18px_rgba(0,0,0,.7)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-18px_rgba(53,37,205,.8)]">
                  <span className="relative z-10">Create your research workspace</span>
                  <span className="material-symbols-outlined relative z-10 text-[19px] transition-transform group-hover:translate-x-1">arrow_forward</span>
                  <span className="absolute inset-0 translate-y-full bg-gradient-to-r from-primary to-tertiary transition-transform duration-300 group-hover:translate-y-0" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant transition-colors hover:text-primary">
                  Already collaborating? <span className="text-primary">Sign in</span>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.65 }}
                className="mt-10 flex flex-wrap gap-2"
              >
                {['Role-aware workspaces', 'Evidence-linked feedback', 'Human-controlled AI'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/25 bg-surface/60 px-3 py-1.5 text-[11px] font-semibold text-on-surface-variant backdrop-blur-md">
                    <span className="material-symbols-outlined text-[14px] text-primary">check_circle</span>{item}
                  </span>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 40, rotate: 2 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10"
            >
              <ResearchSignalMap />
            </motion.div>
          </motion.section>

          {/* Theme-aware product preview */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
            className="w-full max-w-5xl mx-auto mb-40 perspective-[2000px]"
          >
            <div className="relative flex aspect-video scale-95 rotate-x-[5deg] flex-col overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-[0_30px_100px_-20px_rgba(53,37,205,0.22)] transition-all duration-700 ease-out hover:scale-100 hover:rotate-x-0 dark:border-white/10 dark:bg-[#10131d] dark:shadow-[0_30px_100px_-20px_rgba(96,82,255,0.32)]">
              <div className="relative z-10 flex h-11 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#151823]/95">
                <div className="flex items-center gap-2" aria-hidden="true">
                  <span className="h-3 w-3 rounded-full bg-[#ff7f7f] ring-1 ring-black/5 dark:bg-[#ff8f8f]" />
                  <span className="h-3 w-3 rounded-full bg-[#f3c969] ring-1 ring-black/5 dark:bg-[#f2d38a]" />
                  <span className="h-3 w-3 rounded-full bg-[#62b9df] ring-1 ring-black/5 dark:bg-[#75c8eb]" />
                </div>
                <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                  <span className="material-symbols-outlined text-[13px] text-primary">dashboard</span>
                  Supervisor dashboard
                </div>
                <span className="hidden text-[10px] font-semibold text-slate-400 sm:block dark:text-slate-500">Live workspace</span>
              </div>
              <div className="relative min-h-0 flex-1 overflow-hidden bg-slate-50 dark:bg-[#111827]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={isDark ? 'dashboard-dark' : 'dashboard-light'}
                    src={isDark ? '/supervisor-dashboard-dark.png' : '/supervisor-dashboard-light.png'}
                    alt="Supervisor Assistant dashboard showing supervised teams, pending reviews, plagiarism alerts, meetings, and recent submissions"
                    initial={{ opacity: 0, scale: 1.015 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.995 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="h-full w-full object-cover object-top"
                    decoding="async"
                    fetchPriority="high"
                    draggable="false"
                  />
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white/35 to-transparent dark:from-[#10131d]/35" />
              </div>
            </div>
          </motion.div>

          {/* Connected research lifecycle */}
          <section className="relative z-20 pb-28">
            <div className="overflow-hidden rounded-[32px] border border-outline-variant/25 bg-surface/60 p-3 shadow-sm backdrop-blur-xl">
              <div className="grid gap-2 md:grid-cols-4">
                {[
                  ['01', 'Scope', 'Proposal studio', 'edit_note'],
                  ['02', 'Ground', 'Literature desk', 'library_books'],
                  ['03', 'Review', 'Supervisor decisions', 'rate_review'],
                  ['04', 'Defend', 'Submission record', 'workspace_premium']
                ].map(([number, title, detail, icon], index) => (
                  <div key={title} className="group relative rounded-[24px] border border-transparent px-5 py-5 transition hover:border-primary/20 hover:bg-primary/5">
                    {index < 3 && <span className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-outline-variant md:block">→</span>}
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[11px] font-black tracking-[0.2em] text-primary">{number}</span>
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant transition group-hover:text-primary">{icon}</span>
                    </div>
                    <p className="mt-5 text-lg font-black text-on-surface">{title}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Bento Grid Feature Section */}
          <section id="features" className="py-24 relative z-20">
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
                <p className="font-body-sm text-[15px] text-on-surface-variant leading-relaxed">Evidence-led similarity screening across project submissions, with source-discovery support and a required human review.</p>
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
                    Evaluation rubrics, version-linked reviews, and optional AI drafting support help supervisors provide consistent, actionable critiques while keeping the academic decision human-owned.
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
          <section id="audience" className="py-32 relative z-20">
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
                      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant/30 bg-white p-2 shadow-lg shadow-primary/10 dark:border-white/10 dark:bg-[#11131a] dark:shadow-tertiary/30">
                        <BrandLogo compact decorative className="h-full w-full" />
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
                  Connect project work, student evidence, and supervisor decisions in one accountable workspace.
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
              <div className="mb-6 flex h-12 w-[230px] items-center rounded-xl border border-outline-variant/30 bg-white px-3 py-2 dark:border-white/10 dark:bg-[#11131a]">
                <BrandLogo className="h-auto w-full" />
              </div>
              <p className="font-body-md text-[16px] text-on-surface-variant max-w-sm leading-relaxed mb-8 font-light">
                Connecting academic research, evidence, feedback, and supervision in one accountable workspace.
              </p>
            </div>
            
            <div className="col-span-1 md:col-span-2 lg:col-span-2 md:col-start-7 lg:col-start-7">
              <h4 className="font-label-lg text-[14px] font-bold text-on-surface uppercase tracking-wider mb-6">Product</h4>
              <ul className="space-y-4 font-body-sm text-[15px] text-on-surface-variant">
                <li><a className="hover:text-primary transition-colors block" href="#features">Features</a></li>
                <li><a className="hover:text-primary transition-colors block" href="#audience">For students & supervisors</a></li>
              </ul>
            </div>
            
            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <h4 className="font-label-lg text-[14px] font-bold text-on-surface uppercase tracking-wider mb-6">Company</h4>
              <ul className="space-y-4 font-body-sm text-[15px] text-on-surface-variant">
                <li><Link className="hover:text-primary transition-colors block" to="/register">Create account</Link></li>
                <li><Link className="hover:text-primary transition-colors block" to="/login">Sign in</Link></li>
                <li><a className="hover:text-primary transition-colors block" href="mailto:suprevisorassistant@gmail.com">Contact Us</a></li>
              </ul>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-2">
              <h4 className="font-label-lg text-[14px] font-bold text-on-surface uppercase tracking-wider mb-6">Legal</h4>
              <ul className="space-y-4 font-body-sm text-[15px] text-on-surface-variant">
                <li><Link className="hover:text-primary transition-colors block" to="/privacy">Privacy Policy</Link></li>
                <li><Link className="hover:text-primary transition-colors block" to="/terms">Terms of Service</Link></li>
                <li><Link className="hover:text-primary transition-colors block" to="/data-processing">Data Processing</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-outline-variant/20 pt-8 flex flex-col md:flex-row justify-between items-center font-body-sm text-[14px] text-on-surface-variant">
            <p>© 2026 Supervisor Assistant. All rights reserved.</p>
            <Link to="/privacy" className="mt-4 hover:text-primary md:mt-0">Privacy & data use</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
