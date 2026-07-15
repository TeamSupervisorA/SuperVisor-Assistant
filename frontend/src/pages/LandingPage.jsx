import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

// --- Reusable Advanced Components ---

// Text Reveal Component (Staggered Characters)
const TextReveal = ({ text, className, delay = 0 }) => {
  const words = text.split(" ");
  return (
    <div className={`flex flex-wrap justify-center ${className}`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: delay + i * 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
          className="mr-2 md:mr-3"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

// 3D Tilt Card Component
const TiltCard = ({ children, className }) => {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className={`relative z-10 ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div style={{ transform: "translateZ(30px)" }} className="h-full">
        {children}
      </div>
    </motion.div>
  );
};

// Background Floating Orbs
const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div 
        animate={{ 
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.8, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]"
      />
      <motion.div 
        animate={{ 
          x: [0, -120, 80, 0],
          y: [0, 80, -120, 0],
          scale: [1, 0.9, 1.1, 1]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
        className="absolute top-[40%] right-[10%] w-[600px] h-[600px] bg-tertiary-container/20 rounded-full blur-[120px]"
      />
    </div>
  );
};


// --- Main Page ---
const LandingPage = () => {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col overflow-hidden relative selection:bg-primary/20 selection:text-primary">
      <FloatingOrbs />

      <header className="bg-surface/50 backdrop-blur-xl sticky top-0 z-50 px-margin_desktop h-20 flex justify-between items-center border-b border-outline-variant/20 transition-all">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-fixed-variant flex items-center justify-center shadow-lg shadow-primary/20">
            <span aria-hidden="true" className="material-symbols-outlined text-on-primary icon-fill">school</span>
          </div>
          <span className="font-headline-md text-[24px] font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-on-surface to-on-surface-variant">Academic AI</span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex gap-4 items-center"
        >
          <Link to="/login" className="font-label-md text-[14px] font-semibold text-secondary hover:text-primary transition-colors duration-200">Sign In</Link>
          <Link to="/register" className="font-label-md text-[14px] font-semibold bg-on-surface text-surface px-5 py-2.5 rounded-full hover:bg-primary hover:text-on-primary transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5">Get Started</Link>
        </motion.div>
      </header>
      
      <main className="flex-grow flex flex-col items-center z-10 relative">
        <div className="w-full max-w-container_max px-margin_desktop">
          
          <motion.section 
            style={{ y: heroY, opacity: heroOpacity }}
            className="pt-40 pb-32 flex flex-col items-center text-center relative"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container border border-outline-variant/30 mb-8 backdrop-blur-md"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="font-label-md font-semibold text-primary text-[13px]">Gemini 2.5 Flash Integrated</span>
            </motion.div>

            <TextReveal 
              text="Elevate Academic"
              className="font-display text-[64px] md:text-[88px] leading-[1.1] font-black text-on-surface" 
            />
            <TextReveal 
              text="Supervision & Research"
              delay={0.2}
              className="font-display text-[64px] md:text-[88px] leading-[1.1] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-tertiary to-primary bg-[length:200%_auto] animate-gradient" 
            />
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-body-lg text-[22px] text-on-surface-variant max-w-2xl mb-12 mt-8 leading-relaxed"
            >
              Smart supervision for SDP projects, assignments, and thesis papers. Ensure academic integrity and accelerate breakthroughs with AI.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/register" className="font-title-lg text-[18px] font-bold bg-primary text-on-primary px-10 py-4 rounded-full hover:bg-primary-fixed-variant transition-all duration-300 shadow-[0_8px_30px_rgba(53,37,205,0.3)] hover:shadow-[0_12px_40px_rgba(53,37,205,0.4)] hover:-translate-y-1 flex items-center justify-center gap-2">
                Start for Free
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </Link>
              <button className="font-title-lg text-[18px] font-bold text-on-surface bg-surface-container border border-outline-variant/40 px-10 py-4 rounded-full hover:bg-surface-container-high transition-all duration-300 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined icon-fill">play_circle</span>
                Watch Demo
              </button>
            </motion.div>
          </motion.section>

          <section className="py-32 relative z-20">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-16"
            >
              <h2 className="font-headline-lg text-[48px] font-black text-on-surface mb-6 tracking-tight">
                Supervision, <span className="text-primary">Evolved.</span>
              </h2>
              <p className="font-body-lg text-[20px] text-secondary max-w-2xl mx-auto">Everything you need to guide students from proposal to final defense, powered by intelligent automation.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 perspective-[2000px]">
              <TiltCard className="lg:col-span-2">
                <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-10 h-full border border-outline-variant/20 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-bl-full -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-110"></div>
                  <span aria-hidden="true" className="material-symbols-outlined text-primary absolute top-10 right-10 text-4xl opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:rotate-12">auto_awesome</span>
                  
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary text-3xl">psychology</span>
                  </div>
                  <h3 className="font-title-lg text-[28px] font-bold text-on-surface mb-4">AI-Powered Supervisor Insight</h3>
                  <p className="font-body-md text-[18px] text-on-surface-variant mb-8 max-w-lg leading-relaxed">
                    Intelligent guidance tailored to individual student research paths. The AI analyzes proposals, suggests methodologies, and highlights potential academic gaps in real-time.
                  </p>
                  
                  <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/30 flex items-start gap-4">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary text-xl mt-0.5">lightbulb</span>
                    <p className="font-body-sm text-[15px] text-on-surface">
                      "The literature review lacks recent sources on machine learning applied to fluid dynamics. Consider referencing papers published after 2022 to strengthen the foundation."
                    </p>
                  </div>
                </div>
              </TiltCard>

              <TiltCard>
                <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-10 h-full border border-outline-variant/20 shadow-[0_8px_30px_rgba(0,0,0,0.04)] group hover:border-tertiary/30 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-tertiary-container/20 flex items-center justify-center mb-6">
                    <span aria-hidden="true" className="material-symbols-outlined text-tertiary-container text-3xl">timeline</span>
                  </div>
                  <h3 className="font-title-lg text-[24px] font-bold text-on-surface mb-4">Milestone Tracking</h3>
                  <p className="font-body-md text-[16px] text-on-surface-variant mb-8 leading-relaxed">Real-time monitoring of deliverables to ensure projects stay on schedule.</p>
                  <div className="w-full bg-secondary-container h-3 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      whileInView={{ width: "65%" }} 
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="bg-tertiary h-full rounded-full relative overflow-hidden"
                    >
                      <motion.div 
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-white/30 skew-x-12"
                      />
                    </motion.div>
                  </div>
                  <div className="flex justify-between mt-4 font-label-md text-[14px] font-bold text-secondary">
                    <span>Draft Review</span>
                    <span className="text-tertiary">65%</span>
                  </div>
                </div>
              </TiltCard>

              <TiltCard>
                <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-10 h-full border border-outline-variant/20 shadow-[0_8px_30px_rgba(0,0,0,0.04)] group hover:border-error/30 transition-colors">
                  <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mb-6">
                    <span aria-hidden="true" className="material-symbols-outlined text-error text-3xl">policy</span>
                  </div>
                  <h3 className="font-title-lg text-[24px] font-bold text-on-surface mb-4">Plagiarism Checker</h3>
                  <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">Deep semantic analysis against institutional databases to ensure original thought and academic integrity.</p>
                </div>
              </TiltCard>

              <TiltCard className="lg:col-span-2">
                <div className="bg-surface/80 backdrop-blur-xl rounded-[32px] p-10 h-full border border-outline-variant/20 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row gap-8 group hover:border-primary/30 transition-colors">
                  <div className="flex-1">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                      <span aria-hidden="true" className="material-symbols-outlined text-primary text-3xl">rate_review</span>
                    </div>
                    <h3 className="font-title-lg text-[24px] font-bold text-on-surface mb-4">Structured Feedback</h3>
                    <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">Evaluation rubrics combined with AI-assisted drafting allow supervisors to provide comprehensive, actionable critiques up to 3x faster.</p>
                  </div>
                  <div className="flex-1 bg-surface-variant/20 rounded-2xl p-6 border border-outline-variant/20 shadow-inner flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span aria-hidden="true" className="material-symbols-outlined text-primary icon-fill">person</span>
                      </div>
                      <div>
                        <span className="font-label-md text-[15px] font-bold text-on-surface block">Dr. Smith</span>
                        <span className="font-body-sm text-[12px] text-secondary">Supervisor</span>
                      </div>
                    </div>
                    <p className="font-body-sm text-[16px] text-on-surface-variant italic">"Excellent derivation in section 4.2. However, consider clarifying the initial assumptions regarding non-linear constraints."</p>
                  </div>
                </div>
              </TiltCard>
            </div>
          </section>

          <section className="py-32 border-t border-outline-variant/20 relative z-20">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="font-headline-lg text-[48px] font-black text-on-surface mb-6 tracking-tight">Built for <span className="text-tertiary">Everyone.</span></h2>
              <p className="font-body-md text-[20px] text-on-surface-variant max-w-2xl mx-auto">Tailored interfaces designed specifically for the unique workflows of administrators, educators, and researchers.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <TiltCard>
                <div className="bg-surface-container-lowest rounded-[32px] p-12 text-center flex flex-col items-center border border-outline-variant/10 shadow-lg group hover:shadow-xl transition-all h-full">
                  <div className="w-24 h-24 rounded-full bg-surface-variant/30 flex items-center justify-center mb-8 text-on-surface group-hover:bg-on-surface group-hover:text-surface transition-colors duration-500">
                    <span aria-hidden="true" className="material-symbols-outlined text-5xl icon-fill">admin_panel_settings</span>
                  </div>
                  <h3 className="font-headline-md text-[28px] font-bold text-on-surface mb-4">Admin</h3>
                  <p className="font-body-sm text-[16px] text-on-surface-variant leading-relaxed">Oversee departmental progress, allocate resources efficiently, and generate comprehensive institutional analytics.</p>
                </div>
              </TiltCard>

              <TiltCard>
                <div className="bg-surface-container-lowest rounded-[32px] p-12 text-center flex flex-col items-center border-[2px] border-primary/20 shadow-[0_20px_50px_rgba(53,37,205,0.15)] h-full relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-8 text-on-primary shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-500">
                    <span aria-hidden="true" className="material-symbols-outlined text-5xl icon-fill">supervisor_account</span>
                  </div>
                  <h3 className="font-headline-md text-[28px] font-bold text-on-surface mb-4">Supervisor</h3>
                  <p className="font-body-sm text-[16px] text-on-surface-variant leading-relaxed">Manage multiple student projects seamlessly. Utilize AI to draft initial feedback and identify at-risk projects early.</p>
                </div>
              </TiltCard>

              <TiltCard>
                <div className="bg-surface-container-lowest rounded-[32px] p-12 text-center flex flex-col items-center border border-outline-variant/10 shadow-lg group hover:shadow-xl transition-all h-full">
                  <div className="w-24 h-24 rounded-full bg-surface-variant/30 flex items-center justify-center mb-8 text-on-surface group-hover:bg-on-surface group-hover:text-surface transition-colors duration-500">
                    <span aria-hidden="true" className="material-symbols-outlined text-5xl icon-fill">school</span>
                  </div>
                  <h3 className="font-headline-md text-[28px] font-bold text-on-surface mb-4">Student</h3>
                  <p className="font-body-sm text-[16px] text-on-surface-variant leading-relaxed">Receive structured guidance, organize citations, manage versions, and submit deliverables through a stress-free portal.</p>
                </div>
              </TiltCard>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-on-surface text-surface pt-24 pb-12 relative z-20">
        <div className="w-full max-w-container_max px-margin_desktop mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden="true" className="material-symbols-outlined text-primary text-4xl icon-fill">school</span>
                <span className="font-headline-md text-[32px] font-black tracking-tight">Academic AI</span>
              </div>
              <p className="font-body-md text-[18px] text-surface-variant max-w-md leading-relaxed">
                Elevating academic research and supervision through intelligent, institutional-grade technology.
              </p>
            </div>
            <div>
              <h4 className="font-title-lg text-[20px] font-bold text-white mb-6">Platform</h4>
              <ul className="space-y-4 font-body-sm text-[16px] text-surface-variant">
                <li><a className="hover:text-primary transition-colors" href="#">Features</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Pricing</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Security</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Integration</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-title-lg text-[20px] font-bold text-white mb-6">Institution</h4>
              <ul className="space-y-4 font-body-sm text-[16px] text-surface-variant">
                <li><a className="hover:text-primary transition-colors" href="#">About Us</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Research Ethics</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center font-body-sm text-[14px] text-surface-variant">
            <p>© 2026 Academic AI Systems. All rights reserved.</p>
            <div className="flex gap-8 mt-6 md:mt-0">
              <a className="hover:text-white transition-colors" href="#">Terms of Service</a>
              <a className="hover:text-white transition-colors" href="#">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
