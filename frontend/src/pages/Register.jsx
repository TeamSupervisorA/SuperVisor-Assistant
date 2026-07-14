import React from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col md:flex-row">
      <div className="hidden lg:flex w-1/2 bg-surface-container-high relative items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD_NKuK0WAVvAaTL4j4fFea5aPf01BhlQcUDQ9AGAUTYtfhNxi8Dj0wpMmkOmXyVMZHk5M7gxajupzFjdQP60ok_9TPPdVjy_ybIPDiL-KpqAMjdpxZtFfMA3ecNEsx1My1m-R3D-9CDidsL5GHrHJvMnPEWaqa_dgHAsKKI4jzg_nQ8RflVI72uHgMYfL9F959FY8p4JwgC8cTy6A0UUe3Aji2UCllX0RxAcY_hhOj7mIYMbw3aOg7DFjainXXiJjqwtvngxCgt0s')"
          }}
        ></div>
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply backdrop-blur-[2px]"></div>
        
        <div className="relative z-10 bg-surface/90 backdrop-blur-md p-8 rounded-xl shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] border-l-2 border-primary max-w-md mx-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary text-[32px] icon-fill">school</span>
            <h2 className="font-headline-md text-[24px] font-bold text-on-surface">Academic Supervisor Assistant</h2>
          </div>
          <p className="font-body-lg text-[18px] text-secondary">The sophisticated AI co-pilot for high-stakes academic supervision. Manage research, streamline student communication, and maintain institutional oversight with unparalleled clarity.</p>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-surface">
        <div className="w-full max-w-[520px]">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="material-symbols-outlined text-primary text-[28px] icon-fill">school</span>
            <h1 className="font-title-lg text-[20px] font-bold text-on-surface">Academic AI</h1>
          </div>
          
          <div className="mb-10">
            <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-2">Create your account</h2>
            <p className="font-body-md text-[16px] text-secondary">Join the platform to access your academic oversight tools.</p>
          </div>
          
          <form className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-semibold text-on-surface-variant" htmlFor="fullName">Full Name</label>
                <input className="w-full rounded border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-sm px-4 py-2.5 transition-shadow" id="fullName" placeholder="Dr. Jane Doe" type="text" />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-semibold text-on-surface-variant" htmlFor="idNumber">Student / Teacher ID</label>
                <input className="w-full rounded border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-sm px-4 py-2.5 transition-shadow" id="idNumber" placeholder="e.g. 2024-001" type="text" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-semibold text-on-surface-variant" htmlFor="email">University Email</label>
                <input className="w-full rounded border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-sm px-4 py-2.5 transition-shadow" id="email" placeholder="jane.doe@university.edu" type="email" />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-semibold text-on-surface-variant" htmlFor="role">Role</label>
                <div className="relative">
                  <select className="w-full rounded border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-sm px-4 py-2.5 appearance-none transition-shadow" id="role" defaultValue="">
                    <option disabled value="">Select a role...</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher / Supervisor</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-semibold text-on-surface-variant" htmlFor="department">Department</label>
                <input className="w-full rounded border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-sm px-4 py-2.5 transition-shadow" id="department" placeholder="e.g. Computer Science" type="text" />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-semibold text-on-surface-variant" htmlFor="batch">Batch / Designation</label>
                <input className="w-full rounded border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-sm px-4 py-2.5 transition-shadow" id="batch" placeholder="e.g. Fall '24 or Assoc. Prof" type="text" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-semibold text-on-surface-variant" htmlFor="password">Password</label>
                <input className="w-full rounded border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-sm px-4 py-2.5 transition-shadow" id="password" placeholder="••••••••" type="password" />
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-semibold text-on-surface-variant" htmlFor="confirmPassword">Confirm Password</label>
                <input className="w-full rounded border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary focus:ring-1 focus:ring-primary shadow-sm px-4 py-2.5 transition-shadow" id="confirmPassword" placeholder="••••••••" type="password" />
              </div>
            </div>
            
            <div className="pt-4">
              <button className="w-full bg-primary hover:bg-surface-tint text-on-primary font-title-lg text-[20px] font-semibold py-3 px-4 rounded transition-colors duration-200 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.05),_0px_2px_4px_-2px_rgba(0,0,0,0.05)] flex justify-center items-center gap-2" type="button">
                Signup
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </div>
          </form>
          
          <p className="mt-8 text-center font-body-sm text-[14px] text-secondary">
            Already have an account? 
            <Link to="/login" className="font-semibold text-primary hover:text-surface-tint transition-colors ml-1">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
