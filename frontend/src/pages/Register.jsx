import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthContext';

const roleHome = {
  student: '/dashboard',
  supervisor: '/supervisor-dashboard',
  admin: '/admin-dashboard'
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: '', color: '' },
    { label: 'Weak', color: 'bg-error' },
    { label: 'Fair', color: 'bg-orange-400' },
    { label: 'Good', color: 'bg-yellow-500' },
    { label: 'Strong', color: 'bg-tertiary' },
    { label: 'Very Strong', color: 'bg-[#10B981]' }
  ];
  return { score, ...levels[score] };
};

const Register = () => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: '',
    studentId: '',
    department: '',
    batch: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.role) {
      setError('Please select a role.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          password: form.password,
          role: form.role,
          studentId: form.studentId || undefined,
          department: form.department || undefined,
          batch: form.batch || undefined
        })
      });

      login(data.token, data.user);
      navigate(roleHome[data.user.role] || '/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ id, label, type = 'text', placeholder, required = false, icon }) => (
    <div className="space-y-2">
      <label className="block font-label-md text-[13px] font-semibold text-on-surface-variant" htmlFor={id}>{label}</label>
      <div className="relative">
        {icon && <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">{icon}</span>}
        <input 
          className={`w-full bg-surface-container-lowest border border-outline-variant rounded-xl ${icon ? 'pl-11' : 'pl-4'} pr-4 py-3 font-body-md text-[15px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline`}
          id={id} 
          placeholder={placeholder} 
          type={type} 
          required={required} 
          value={form[id]} 
          onChange={handleChange} 
        />
      </div>
    </div>
  );

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen flex flex-col lg:flex-row">
      {/* Left — Animated Illustration Panel */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-tertiary-container via-primary to-primary-container animate-gradient bg-[length:400%_400%]"></div>
        
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] right-[20%] w-24 h-24 border-2 border-white/15 rounded-full backdrop-blur-sm"
        />
        <motion.div 
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute bottom-[15%] left-[15%] w-16 h-16 bg-white/10 rounded-xl backdrop-blur-sm rotate-12"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 text-center px-12 max-w-lg"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-8 shadow-2xl border border-white/20">
            <span className="material-symbols-outlined text-white text-[40px] icon-fill">how_to_reg</span>
          </div>
          <h2 className="text-white font-headline-lg text-[36px] font-black tracking-tight mb-4 leading-tight">
            Join the Platform
          </h2>
          <p className="text-white/80 font-body-lg text-[18px] leading-relaxed">
            Create your account to access intelligent academic supervision tools, project management, and AI-powered research assistance.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <span className="material-symbols-outlined text-white/90 text-[28px] mb-2 block">psychology</span>
              <span className="text-white/80 font-label-md text-[12px] font-semibold">AI Feedback</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <span className="material-symbols-outlined text-white/90 text-[28px] mb-2 block">groups</span>
              <span className="text-white/80 font-label-md text-[12px] font-semibold">Team Collab</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <span className="material-symbols-outlined text-white/90 text-[28px] mb-2 block">trending_up</span>
              <span className="text-white/80 font-label-md text-[12px] font-semibold">Track Progress</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right — Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-surface overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[520px]"
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary icon-fill">school</span>
            </div>
            <h1 className="font-title-lg text-[20px] font-bold text-on-surface">Academic AI</h1>
          </div>

          <div className="mb-8">
            <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-2">Create your account</h2>
            <p className="font-body-md text-[16px] text-secondary">Join the platform to access your academic workspace.</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InputField id="fullName" label="Full Name" placeholder="Dr. Jane Doe" required icon="person" />
              <div className="space-y-2">
                <label className="block font-label-md text-[13px] font-semibold text-on-surface-variant" htmlFor="role">Role</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">badge</span>
                  <select 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-10 py-3 font-body-md text-[15px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none transition-all" 
                    id="role" 
                    required 
                    value={form.role} 
                    onChange={handleChange}
                  >
                    <option disabled value="">Select a role...</option>
                    <option value="student">Student</option>
                    <option value="supervisor">Teacher / Supervisor</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            <InputField id="email" label="University Email" type="email" placeholder="you@university.edu" required icon="mail" />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <InputField id="studentId" label="Student / Staff ID" placeholder="2024-001" icon="id_card" />
              <InputField id="department" label="Department" placeholder="Computer Science" icon="domain" />
              <InputField id="batch" label="Batch / Year" placeholder="Fall '24" icon="calendar_month" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block font-label-md text-[13px] font-semibold text-on-surface-variant" htmlFor="password">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-12 py-3 font-body-md text-[15px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline" 
                    id="password" 
                    placeholder="••••••••" 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={form.password} 
                    onChange={handleChange} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {form.password && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= passwordStrength.score ? passwordStrength.color : 'bg-surface-variant'}`} />
                      ))}
                    </div>
                    <span className={`font-label-md text-[11px] font-semibold ${passwordStrength.score <= 1 ? 'text-error' : passwordStrength.score <= 3 ? 'text-outline' : 'text-[#10B981]'}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-[13px] font-semibold text-on-surface-variant" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-11 pr-12 py-3 font-body-md text-[15px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-outline" 
                    id="confirmPassword" 
                    placeholder="••••••••" 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    required 
                    value={form.confirmPassword} 
                    onChange={handleChange} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                className="w-full bg-primary hover:bg-surface-tint text-on-primary font-title-lg text-[16px] font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" 
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center font-body-sm text-[14px] text-secondary">
            Already have an account?
            <Link to="/login" className="font-semibold text-primary hover:text-surface-tint transition-colors ml-1">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
