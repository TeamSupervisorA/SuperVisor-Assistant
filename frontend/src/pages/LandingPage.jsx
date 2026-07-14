import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      <header className="bg-surface-bright/90 backdrop-blur-md sticky top-0 z-50 px-margin_desktop h-16 flex justify-between items-center border-b border-outline-variant">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="material-symbols-outlined text-primary text-3xl icon-fill">school</span>
          <span className="font-headline-md text-headline-md font-bold text-primary">Academic AI</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="font-label-md text-label-md text-primary border border-primary px-4 py-2 rounded-lg hover:bg-surface-container-low transition-colors duration-200">Login</Link>
          <Link to="/register" className="font-label-md text-label-md bg-primary text-on-primary px-4 py-2 rounded-lg hover:bg-on-primary-fixed-variant transition-colors duration-200">Get Started</Link>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center">
        <div className="w-full max-w-container_max px-margin_desktop">
          <section className="py-24 flex flex-col items-center text-center">
            <h1 className="font-display text-[48px] leading-[56px] font-bold text-on-surface mb-6 max-w-4xl">AI Academic Supervisor Assistant</h1>
            <p className="font-body-lg text-[18px] text-on-surface-variant max-w-2xl mb-10">Smart supervision for SDP projects, assignments, research papers, and thesis papers.</p>
            <div className="flex gap-4">
              <Link to="/register" className="font-title-lg text-[20px] font-semibold bg-primary text-on-primary px-8 py-3 rounded-lg hover:bg-on-primary-fixed-variant transition-colors duration-200 ambient-shadow">Get Started Now</Link>
              <button className="font-title-lg text-[20px] font-semibold text-primary border-2 border-primary px-8 py-3 rounded-lg hover:bg-surface-container-low transition-colors duration-200">Watch Demo</button>
            </div>
          </section>

          <section className="py-16">
            <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-10 text-center">Comprehensive Supervision Suite</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ai-border lg:col-span-2 relative overflow-hidden">
                <span aria-hidden="true" className="material-symbols-outlined text-primary absolute top-6 right-6">auto_awesome</span>
                <div className="flex items-center gap-3 mb-4">
                  <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">psychology</span>
                  <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">AI Supervisor</h3>
                </div>
                <p className="font-body-md text-[16px] text-on-surface-variant mb-4 max-w-md">Intelligent guidance tailored to individual student research paths. The AI analyzes proposals, suggests methodologies, and highlights potential academic gaps.</p>
                <div className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30 flex items-start gap-3">
                  <span aria-hidden="true" className="material-symbols-outlined text-secondary text-sm mt-1">info</span>
                  <p className="font-body-sm text-[14px] text-secondary">"The literature review lacks recent sources on machine learning applied to fluid dynamics. Suggest reviewing papers published after 2022."</p>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <span aria-hidden="true" className="material-symbols-outlined text-tertiary-container text-2xl">timeline</span>
                  <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Progress Tracking</h3>
                </div>
                <p className="font-body-md text-[16px] text-on-surface-variant mb-6">Real-time monitoring of milestones and deliverables.</p>
                <div className="w-full bg-secondary-container h-1 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[65%] rounded-full"></div>
                </div>
                <div className="flex justify-between mt-2 font-label-md text-[12px] font-semibold text-secondary">
                  <span>Chapter 3 Draft</span>
                  <span>65% Complete</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <span aria-hidden="true" className="material-symbols-outlined text-error text-2xl">policy</span>
                  <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Plagiarism Checker</h3>
                </div>
                <p className="font-body-md text-[16px] text-on-surface-variant">Deep semantic analysis against institutional databases to ensure academic integrity.</p>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <span aria-hidden="true" className="material-symbols-outlined text-secondary text-2xl">history</span>
                  <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Document Version Control</h3>
                </div>
                <p className="font-body-md text-[16px] text-on-surface-variant">Seamlessly manage iterations, track changes, and revert to previous drafts with ease.</p>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">event</span>
                  <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Meeting Scheduling</h3>
                </div>
                <p className="font-body-md text-[16px] text-on-surface-variant">Automated calendar syncing to find optimal consultation times between supervisors and students.</p>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow lg:col-span-2 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">rate_review</span>
                    <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Teacher Feedback</h3>
                  </div>
                  <p className="font-body-md text-[16px] text-on-surface-variant">Structured feedback forms with AI-assisted drafting to provide comprehensive and actionable critiques faster.</p>
                </div>
                <div className="flex-1 bg-surface-variant/30 rounded-lg p-4 border border-outline-variant/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span aria-hidden="true" className="material-symbols-outlined text-primary text-sm icon-fill">person</span>
                    </div>
                    <span className="font-label-md text-[12px] font-semibold text-on-surface">Dr. Smith</span>
                  </div>
                  <p className="font-body-sm text-[14px] text-on-surface-variant">Excellent derivation in section 4.2. However, consider clarifying the initial assumptions.</p>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-6 ambient-shadow ai-border lg:col-span-3 flex justify-between items-center relative overflow-hidden group hover:bg-surface-container-low transition-colors duration-300 cursor-pointer">
                <span aria-hidden="true" className="material-symbols-outlined text-primary absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">auto_awesome</span>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">summarize</span>
                    <h3 className="font-title-lg text-[20px] font-semibold text-on-surface">Report Generation</h3>
                  </div>
                  <p className="font-body-md text-[16px] text-on-surface-variant max-w-2xl">Instantly compile semester progress reports, committee summaries, and institutional compliance documents with a single click.</p>
                </div>
                <button className="hidden md:flex font-label-md text-[12px] font-semibold bg-primary text-on-primary px-6 py-2 rounded-lg items-center gap-2">
                  Generate Now <span aria-hidden="true" className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </section>

          <section className="py-16 border-t border-outline-variant/30">
            <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-4 text-center">Empowering All Roles</h2>
            <p className="font-body-md text-[16px] text-on-surface-variant mb-10 text-center max-w-2xl mx-auto">Tailored interfaces and tools designed specifically for the unique needs of administrators, educators, and researchers.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-6">
                  <span aria-hidden="true" className="material-symbols-outlined text-primary text-3xl icon-fill">admin_panel_settings</span>
                </div>
                <h3 className="font-headline-md text-[24px] font-semibold text-on-surface mb-3">Admin</h3>
                <p className="font-body-sm text-[14px] text-on-surface-variant">Oversee departmental progress, allocate supervisory resources efficiently, and generate institutional analytics to maintain academic standards.</p>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center flex flex-col items-center border border-primary/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transform -translate-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span aria-hidden="true" className="material-symbols-outlined text-primary text-3xl icon-fill">supervisor_account</span>
                </div>
                <h3 className="font-headline-md text-[24px] font-semibold text-on-surface mb-3">Teacher</h3>
                <p className="font-body-sm text-[14px] text-on-surface-variant">Manage multiple student projects seamlessly. Utilize AI to draft initial feedback, track deadlines, and identify at-risk projects early.</p>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-8 ambient-shadow text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-6">
                  <span aria-hidden="true" className="material-symbols-outlined text-primary text-3xl icon-fill">school</span>
                </div>
                <h3 className="font-headline-md text-[24px] font-semibold text-on-surface mb-3">Student</h3>
                <p className="font-body-sm text-[14px] text-on-surface-variant">Receive structured guidance, organize citations, manage versions, and submit deliverables through a clear, stress-free portal.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-inverse-surface text-inverse-on-surface mt-20 pt-16 pb-8 border-t border-outline-variant/10">
        <div className="w-full max-w-container_max px-margin_desktop mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span aria-hidden="true" className="material-symbols-outlined text-inverse-primary text-2xl icon-fill">school</span>
                <span className="font-headline-md text-[24px] font-bold text-inverse-primary">Academic AI</span>
              </div>
              <p className="font-body-sm text-[14px] text-secondary-fixed-dim max-w-sm">
                Elevating academic research and supervision through intelligent, institutional-grade technology.
              </p>
            </div>
            <div>
              <h4 className="font-title-lg text-[20px] text-on-tertiary mb-4">Platform</h4>
              <ul className="space-y-2 font-body-sm text-[14px] text-secondary-fixed-dim">
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Features</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Pricing</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Security</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Integration</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-title-lg text-[20px] text-on-tertiary mb-4">Institution</h4>
              <ul className="space-y-2 font-body-sm text-[14px] text-secondary-fixed-dim">
                <li><a className="hover:text-inverse-primary transition-colors" href="#">About Us</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Research Ethics</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Privacy Policy</a></li>
                <li><a className="hover:text-inverse-primary transition-colors" href="#">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary/30 pt-8 flex flex-col md:flex-row justify-between items-center font-body-sm text-[14px] text-secondary-fixed-dim">
            <p>© 2024 Academic AI Systems. All rights reserved.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
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
