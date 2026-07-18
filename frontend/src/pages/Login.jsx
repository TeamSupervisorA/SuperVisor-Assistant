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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Full-screen animated mesh background */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ x: [-200, 200, -200], y: [-100, 100, -100] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[10%] left-[20%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ x: [200, -200, 200], y: [100, -100, 100] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-tertiary/20 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[40%] w-[800px] h-[400px] bg-primary-container/10 rounded-full blur-[150px]"
        />
      </div>

      <div className="relative z-10 w-full max-w-[1200px] px-6 py-12 flex flex-col items-center">
        
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-10"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/20 backdrop-blur-md flex items-center justify-center border border-primary/30 shadow-lg">
            <span className="material-symbols-outlined text-primary text-[28px] icon-fill">school</span>
          </div>
          <h1 className="font-display text-[28px] font-black text-on-surface tracking-tight">SuperVisor<span className="text-primary font-light">AI</span></h1>
        </motion.div>

        {/* Central Glass Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[480px] bg-surface/60 backdrop-blur-2xl rounded-[40px] p-10 sm:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-white/10 dark:border-white/5 relative overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

          <div className="text-center mb-10">
            <h2 className="font-display text-[32px] font-black text-on-surface mb-2 tracking-tight">Welcome back</h2>
            <p className="font-body-md text-[15px] text-secondary">Enter your credentials to access your workspace.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-error/10 text-error border border-error/20 rounded-2xl font-body-sm text-[14px] flex items-start gap-3 backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-[20px] mt-0.5">error</span>
              <span className="flex-1 leading-snug">{error}</span>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest pl-1" htmlFor="email">Email</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[22px] group-focus-within:text-primary transition-colors">mail</span>
                <input
                  className="w-full bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/50 rounded-2xl pl-12 pr-4 py-4 font-body-md text-[15px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50 hover:bg-surface-container-lowest/80 shadow-inner"
                  id="email"
                  name="email"
                  placeholder="name@university.edu"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center pl-1">
                <label className="block font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest" htmlFor="password">Password</label>
                <a className="font-label-md text-[12px] font-bold text-primary hover:text-primary-fixed-variant transition-colors" href="#">Forgot?</a>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[22px] group-focus-within:text-primary transition-colors">lock</span>
                <input
                  className="w-full bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/50 rounded-2xl pl-12 pr-12 py-4 font-body-md text-[15px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50 hover:bg-surface-container-lowest/80 shadow-inner"
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-1 pt-2">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-outline-variant/50 text-primary focus:ring-primary accent-primary bg-surface-container-lowest/50"
              />
              <label htmlFor="remember" className="font-body-sm text-[13px] font-medium text-secondary select-none cursor-pointer">Keep me signed in</label>
            </div>

            <button
              className="w-full bg-primary hover:bg-primary-fixed-variant text-on-primary font-title-md text-[16px] font-bold py-4 rounded-2xl transition-all duration-300 mt-4 flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(var(--primary-rgb),0.25)] hover:shadow-[0_12px_25px_rgba(var(--primary-rgb),0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed group"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="material-symbols-outlined text-[20px]">sync</motion.span> Signing in...</>
              ) : (
                <>Sign In <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span></>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="font-body-sm text-[14px] text-secondary">
              Don't have an account?{' '}
              <Link to="/register" className="font-title-sm font-bold text-primary hover:text-primary-fixed-variant hover:underline transition-all">
                Create one now
              </Link>
            </p>
          </div>
        </motion.div>
        
        {/* Footer Links */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-12 flex gap-6 text-[13px] font-medium text-secondary/60"
        >
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-colors">Help Center</a>
        </motion.div>

      </div>
    </div>
  );
};

export default Login;
