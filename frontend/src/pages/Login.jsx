import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthContext';

const roleHome = {
  student: '/dashboard',
  supervisor: '/supervisor-dashboard',
  admin: '/admin-dashboard'
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      login(data.token, data.user);
      navigate(roleHome[data.user.role] || '/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col lg:flex-row">
      {/* Left — Animated Illustration Panel */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-container dark:via-[#3a30b8] to-tertiary-container animate-gradient bg-[length:400%_400%]"></div>
        
        {/* Floating geometric shapes */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[20%] w-20 h-20 border-2 border-white/20 rounded-2xl backdrop-blur-sm"
        />
        <motion.div 
          animate={{ y: [0, 15, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[20%] right-[15%] w-32 h-32 border-2 border-white/15 rounded-full backdrop-blur-sm"
        />
        <motion.div 
          animate={{ y: [0, 10, 0], x: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-[40%] right-[30%] w-16 h-16 bg-white/10 rounded-lg backdrop-blur-sm rotate-45"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 text-center px-12 max-w-lg"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-8 shadow-2xl border border-white/20">
            <span className="material-symbols-outlined text-white text-[40px] icon-fill">school</span>
          </div>
          <h2 className="text-white font-headline-lg text-[36px] font-black tracking-tight mb-4 leading-tight">
            Academic Supervisor<br/>Assistant
          </h2>
          <p className="text-white/80 font-body-lg text-[18px] leading-relaxed">
            The intelligent co-pilot for research supervision, project management, and academic integrity.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-6 text-white/60">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span className="font-label-md text-[13px] font-semibold">AI-Powered</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/40"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">lock</span>
              <span className="font-label-md text-[13px] font-semibold">Secure</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-white/40"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">speed</span>
              <span className="font-label-md text-[13px] font-semibold">Fast</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-surface">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary icon-fill">school</span>
            </div>
            <h1 className="font-title-lg text-[20px] font-bold text-on-surface">Academic AI</h1>
          </div>

          <div className="mb-10">
            <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-2">Welcome back</h2>
            <p className="font-body-md text-[16px] text-secondary">Sign in to continue to your workspace.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl font-body-sm text-[14px] flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="p-1 hover:bg-on-error-container/10 rounded-full transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </motion.div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block font-label-md text-[13px] font-semibold text-on-surface-variant" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">mail</span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-4 py-3.5 font-body-md text-[15px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant/70"
                  id="email"
                  name="email"
                  placeholder="you@university.edu"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block font-label-md text-[13px] font-semibold text-on-surface-variant" htmlFor="password">Password</label>
                <a className="font-label-md text-[12px] font-semibold text-primary hover:text-surface-tint transition-colors" href="#">Forgot password?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">lock</span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-12 py-3.5 font-body-md text-[15px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-on-surface-variant/70"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary accent-primary"
              />
              <label htmlFor="remember" className="font-body-sm text-[13px] text-secondary select-none cursor-pointer">Remember me for 30 days</label>
            </div>

            <button
              className="w-full bg-primary hover:bg-surface-tint text-on-primary font-title-lg text-[16px] font-semibold py-3.5 rounded-xl transition-all duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <motion.span 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="material-symbols-outlined text-[20px]"
                  >progress_activity</motion.span>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-variant text-center">
            <p className="font-body-sm text-[14px] text-secondary">
              New to the platform?
              <Link to="/register" className="text-primary font-bold hover:underline transition-all ml-1">Create an account</Link>
            </p>
          </div>

          <div className="text-center mt-6">
            <p className="font-label-md text-[12px] text-outline inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
              System Operational · Encrypted Connection
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
