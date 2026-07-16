import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/api/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      login(data.token, data.user);
      navigate('/admin-dashboard');
    } catch (err) {
      setError(err.message || 'An error occurred while logging in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0A0A0A] text-white font-body-md antialiased min-h-screen flex flex-col lg:flex-row">
      {/* Left — Animated Illustration Panel */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A0505] via-[#4A0E0E] to-[#0A0A0A] animate-gradient bg-[length:400%_400%]"></div>
        
        {/* Floating geometric shapes (Admin/Security Themed) */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 90, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[20%] w-24 h-24 border border-error/30 rounded-lg backdrop-blur-sm"
        />
        <motion.div 
          animate={{ y: [0, 15, 0], rotate: [0, -45, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[20%] right-[15%] w-32 h-32 border-2 border-error/20 rounded-full backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 text-center px-12 max-w-lg"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-error/20 backdrop-blur-md flex items-center justify-center mb-8 shadow-2xl border border-error/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-error/10 animate-pulse"></div>
            <span className="material-symbols-outlined text-error-container text-[40px] relative z-10">admin_panel_settings</span>
          </div>
          <h2 className="text-white font-display text-[42px] font-black tracking-tight mb-4 leading-tight">
            Restricted<br/>Access Area
          </h2>
          <p className="text-white/60 font-body-lg text-[18px] leading-relaxed">
            Platform administration, system configuration, and high-level analytical overviews.
          </p>
          
          <div className="mt-12 flex flex-col gap-4 max-w-[280px] mx-auto text-left">
             <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-md">
                <span className="material-symbols-outlined text-error text-[20px]">security</span>
                <span className="font-label-md text-[13px] font-bold text-white/80 uppercase tracking-widest">End-to-End Encrypted</span>
             </div>
             <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-md">
                <span className="material-symbols-outlined text-error text-[20px]">policy</span>
                <span className="font-label-md text-[13px] font-bold text-white/80 uppercase tracking-widest">Strict Audit Logging</span>
             </div>
          </div>
        </motion.div>
      </div>

      {/* Right — Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#0F0F0F] relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-error/5 rounded-full blur-[80px]"></div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] relative z-10"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-error/20 flex items-center justify-center border border-error/40">
              <span className="material-symbols-outlined text-error">admin_panel_settings</span>
            </div>
            <h1 className="font-display text-[20px] font-black text-white uppercase tracking-wider">Admin Portal</h1>
          </div>

          <div className="mb-10">
            <h2 className="font-display text-[32px] font-black text-white mb-2">System Authentication</h2>
            <p className="font-body-md text-[16px] text-white/50">Authorized personnel only. Please verify your identity.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-error/10 border border-error/30 text-error rounded-xl font-label-md text-[13px] font-bold flex items-center gap-3 uppercase tracking-wide"
            >
              <span className="material-symbols-outlined text-[20px]">gpp_bad</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="p-1 hover:bg-error/20 rounded-full transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="block font-label-md text-[12px] font-bold text-white/70 uppercase tracking-widest" htmlFor="email">Admin ID (Email)</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-[20px] group-focus-within:text-error transition-colors">badge</span>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 font-body-md text-[15px] text-white focus:outline-none focus:ring-1 focus:ring-error focus:border-error transition-all placeholder:text-white/30"
                  id="email" type="email" placeholder="admin@institution.edu" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-label-md text-[12px] font-bold text-white/70 uppercase tracking-widest" htmlFor="password">Secure Password</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-[20px] group-focus-within:text-error transition-colors">key</span>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 font-body-md text-[15px] text-white focus:outline-none focus:ring-1 focus:ring-error focus:border-error transition-all placeholder:text-white/30 tracking-widest"
                  id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <button
              className="w-full bg-error hover:bg-error/80 text-white font-label-md text-[14px] font-bold uppercase tracking-widest py-4 rounded-xl transition-all duration-200 mt-4 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]"
              type="submit" disabled={loading}
            >
              {loading ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="material-symbols-outlined">sync</motion.span>
                  Authenticating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">lock_open</span>
                  Authorize Access
                </>
              )}
            </button>
          </form>
          
          <div className="mt-12 text-center">
             <button onClick={() => navigate('/login')} className="font-label-md text-[12px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-widest inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Return to Standard Login
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
