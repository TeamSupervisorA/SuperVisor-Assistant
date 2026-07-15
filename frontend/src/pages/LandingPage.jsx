import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUpVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const scaleUpVariant = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

const LandingPage = () => {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col overflow-hidden">
      <header className="bg-surface-bright/80 backdrop-blur-md sticky top-0 z-50 px-margin_desktop h-16 flex justify-between items-center border-b border-outline-variant/30">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          <span aria-hidden="true" className="material-symbols-outlined text-primary text-3xl icon-fill">school</span>
          <span className="font-headline-md text-headline-md font-bold text-primary">Academic AI</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex gap-4"
        >
          <Link to="/login" className="font-label-md text-label-md text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors duration-200">Login</Link>
          <Link to="/register" className="font-label-md text-label-md bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-primary-fixed-variant transition-colors duration-200 shadow-sm hover:shadow-md">Get Started</Link>
        </motion.div>
      </header>
      
      <main className="flex-grow flex flex-col items-center">
        <div className="w-full max-w-container_max px-margin_desktop">
          
          <section className="py-32 flex flex-col items-center text-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[56px] md:text-[72px] leading-[1.1] font-bold text-on-surface mb-6 max-w-4xl relative z-10"
            >
              AI Academic Supervisor <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary-container">Assistant</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-body-lg text-[20px] text-on-surface-variant max-w-2xl mb-10 relative z-10"
            >
              Smart supervision for SDP projects, assignments, research papers, and thesis papers. Ensure academic integrity and accelerate research.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex gap-4 relative z-10"
            >
              <Link to="/register" className="font-title-lg text-[18px] font-semibold bg-primary text-on-primary px-8 py-3.5 rounded-xl hover:bg-primary-fixed-variant transition-all duration-300 shadow-[0_8px_20px_rgba(53,37,205,0.25)] hover:shadow-[0_12px_24px_rgba(53,37,205,0.35)] hover:-translate-y-1">Get Started Now</Link>
              <button className="font-title-lg text-[18px] font-semibold text-primary border-2 border-primary/20 bg-primary/5 px-8 py-3.5 rounded-xl hover:bg-primary/10 hover:border-primary/40 transition-all duration-300">Watch Demo</button>
            </motion.div>
          </section>

          <section className="py-24">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="font-headline-lg text-[36px] font-bold text-on-surface mb-12 text-center"
            >
              Comprehensive Supervision Suite
            </motion.h2>
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <motion.div variants={scaleUpVariant} className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow ai-border lg:col-span-2 relative overflow-hidden group hover:shadow-lg transition-shadow duration-300">
                <span aria-hidden="true" className="material-symbols-outlined text-primary absolute top-8 right-8 text-3xl opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">auto_awesome</span>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">psychology</span>
                  </div>
                  <h3 className="font-title-lg text-[22px] font-semibold text-on-surface">AI Supervisor</h3>
                </div>
                <p className="font-body-md text-[16px] text-on-surface-variant mb-6 max-w-lg leading-relaxed">Intelligent guidance tailored to individual student research paths. The AI analyzes proposals, suggests methodologies, and highlights potential academic gaps.</p>
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex items-start gap-3 transform transition-transform group-hover:translate-x-1">
                  <span aria-hidden="true" className="material-symbols-outlined text-secondary text-sm mt-1">info</span>
                  <p className="font-body-sm text-[14px] text-secondary">"The literature review lacks recent sources on machine learning applied to fluid dynamics. Suggest reviewing papers published after 2022."</p>
                </div>
              </motion.div>

              <motion.div variants={scaleUpVariant} className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow hover:shadow-lg transition-all duration-300 group hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-tertiary-container/10 flex items-center justify-center">
                    <span aria-hidden="true" className="material-symbols-outlined text-tertiary-container text-2xl">timeline</span>
                  </div>
                  <h3 className="font-title-lg text-[22px] font-semibold text-on-surface">Progress Tracking</h3>
                </div>
                <p className="font-body-md text-[16px] text-on-surface-variant mb-8 leading-relaxed">Real-time monitoring of milestones and deliverables.</p>
                <div className="w-full bg-secondary-container h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    whileInView={{ width: "65%" }} 
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="bg-primary h-full rounded-full"
                  />
                </div>
                <div className="flex justify-between mt-3 font-label-md text-[13px] font-semibold text-secondary">
                  <span>Chapter 3 Draft</span>
                  <span className="text-primary">65% Complete</span>
                </div>
              </motion.div>

              <motion.div variants={scaleUpVariant} className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow hover:shadow-lg transition-shadow duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center">
                    <span aria-hidden="true" className="material-symbols-outlined text-error text-2xl">policy</span>
                  </div>
                  <h3 className="font-title-lg text-[22px] font-semibold text-on-surface">Plagiarism Checker</h3>
                </div>
                <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">Deep semantic analysis against institutional databases to ensure academic integrity.</p>
              </motion.div>

              <motion.div variants={scaleUpVariant} className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow hover:shadow-lg transition-shadow duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <span aria-hidden="true" className="material-symbols-outlined text-secondary text-2xl">history</span>
                  </div>
                  <h3 className="font-title-lg text-[22px] font-semibold text-on-surface">Version Control</h3>
                </div>
                <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">Seamlessly manage iterations, track changes, and revert to previous drafts with ease.</p>
              </motion.div>

              <motion.div variants={scaleUpVariant} className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow hover:shadow-lg transition-shadow duration-300 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">event</span>
                  </div>
                  <h3 className="font-title-lg text-[22px] font-semibold text-on-surface">Meeting Scheduling</h3>
                </div>
                <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">Automated calendar syncing to find optimal consultation times between supervisors and students.</p>
              </motion.div>

              <motion.div variants={scaleUpVariant} className="bg-surface-container-lowest rounded-2xl p-8 ambient-shadow lg:col-span-2 flex flex-col md:flex-row gap-8 hover:shadow-lg transition-shadow duration-300 group">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">rate_review</span>
                    </div>
                    <h3 className="font-title-lg text-[22px] font-semibold text-on-surface">Teacher Feedback</h3>
                  </div>
                  <p className="font-body-md text-[16px] text-on-surface-variant leading-relaxed">Structured feedback forms with AI-assisted drafting to provide comprehensive and actionable critiques faster.</p>
                </div>
                <div className="flex-1 bg-surface-variant/30 rounded-xl p-5 border border-outline-variant/30 group-hover:border-outline-variant/60 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span aria-hidden="true" className="material-symbols-outlined text-primary text-md icon-fill">person</span>
                    </div>
                    <span className="font-label-md text-[14px] font-semibold text-on-surface">Dr. Smith</span>
                  </div>
                  <p className="font-body-sm text-[15px] text-on-surface-variant">Excellent derivation in section 4.2. However, consider clarifying the initial assumptions.</p>
                </div>
              </motion.div>
            </motion.div>
          </section>

          <section className="py-24 border-t border-outline-variant/20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="font-headline-lg text-[36px] font-bold text-on-surface mb-4">Empowering All Roles</h2>
              <p className="font-body-md text-[18px] text-on-surface-variant max-w-2xl mx-auto">Tailored interfaces and tools designed specifically for the unique needs of administrators, educators, and researchers.</p>
            </motion.div>
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <motion.div variants={fadeUpVariant} className="bg-surface-container-lowest rounded-3xl p-10 ambient-shadow text-center flex flex-col items-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-20 h-20 rounded-2xl bg-surface-variant/50 flex items-center justify-center mb-6 text-primary">
                  <span aria-hidden="true" className="material-symbols-outlined text-4xl icon-fill">admin_panel_settings</span>
                </div>
                <h3 className="font-headline-md text-[26px] font-semibold text-on-surface mb-4">Admin</h3>
                <p className="font-body-sm text-[15px] text-on-surface-variant leading-relaxed">Oversee departmental progress, allocate supervisory resources efficiently, and generate institutional analytics to maintain academic standards.</p>
              </motion.div>

              <motion.div variants={fadeUpVariant} className="bg-surface-container-lowest rounded-3xl p-10 ambient-shadow text-center flex flex-col items-center border-[2px] border-primary/20 shadow-[0_12px_40px_rgb(53,37,205,0.1)] transform -translate-y-4 hover:shadow-[0_16px_50px_rgb(53,37,205,0.15)] hover:-translate-y-6 transition-all duration-300">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
                  <span aria-hidden="true" className="material-symbols-outlined text-4xl icon-fill">supervisor_account</span>
                </div>
                <h3 className="font-headline-md text-[26px] font-semibold text-on-surface mb-4">Supervisor</h3>
                <p className="font-body-sm text-[15px] text-on-surface-variant leading-relaxed">Manage multiple student projects seamlessly. Utilize AI to draft initial feedback, track deadlines, and identify at-risk projects early.</p>
              </motion.div>

              <motion.div variants={fadeUpVariant} className="bg-surface-container-lowest rounded-3xl p-10 ambient-shadow text-center flex flex-col items-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="w-20 h-20 rounded-2xl bg-surface-variant/50 flex items-center justify-center mb-6 text-primary">
                  <span aria-hidden="true" className="material-symbols-outlined text-4xl icon-fill">school</span>
                </div>
                <h3 className="font-headline-md text-[26px] font-semibold text-on-surface mb-4">Student</h3>
                <p className="font-body-sm text-[15px] text-on-surface-variant leading-relaxed">Receive structured guidance, organize citations, manage versions, and submit deliverables through a clear, stress-free portal.</p>
              </motion.div>
            </motion.div>
          </section>
        </div>
      </main>

      <footer className="bg-inverse-surface text-inverse-on-surface pt-20 pb-8 border-t border-outline-variant/10">
        <div className="w-full max-w-container_max px-margin_desktop mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <span aria-hidden="true" className="material-symbols-outlined text-inverse-primary text-3xl icon-fill">school</span>
                <span className="font-headline-md text-[26px] font-bold text-inverse-primary">Academic AI</span>
              </div>
              <p className="font-body-md text-[16px] text-secondary-fixed-dim max-w-md leading-relaxed">
                Elevating academic research and supervision through intelligent, institutional-grade technology.
              </p>
            </div>
            <div>
              <h4 className="font-title-lg text-[18px] font-semibold text-on-tertiary mb-6">Platform</h4>
              <ul className="space-y-4 font-body-sm text-[15px] text-secondary-fixed-dim">
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Features</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Pricing</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Security</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Integration</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-title-lg text-[18px] font-semibold text-on-tertiary mb-6">Institution</h4>
              <ul className="space-y-4 font-body-sm text-[15px] text-secondary-fixed-dim">
                <li><a className="hover:text-inverse-primary transition-colors" href="#">About Us</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Research Ethics</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center font-body-sm text-[14px] text-secondary-fixed-dim">
            <p>© 2026 Academic AI Systems. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a className="hover:text-inverse-primary transition-colors" href="#">Terms of Service</a>
              <a className="hover:text-inverse-primary transition-colors" href="#">Accessibility</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
