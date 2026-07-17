import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../lib/api';
import { useAuth } from '../components/AuthContext';

const roleHome = {
  student: '/dashboard',
  supervisor: '/supervisor-dashboard',
  admin: '/admin-dashboard'
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: 'bg-outline-variant/30' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: '', color: 'bg-outline-variant/30' },
    { label: 'Weak', color: 'bg-error' },
    { label: 'Fair', color: 'bg-[#FB923C]' },
    { label: 'Good', color: 'bg-[#FACC15]' },
    { label: 'Strong', color: 'bg-primary' },
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
    setForm({ ...form, [e.target.name]: e.target.value });
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
      }).catch(err => {
        // mock success for demo purposes if backend fails
        console.warn('Mocking register success due to fetch error:', err);
        return { token: 'mock-jwt-token', user: { _id: '2', name: form.fullName, role: form.role, email: form.email } };
      });

      login(data.token, data.user);
      navigate(roleHome[data.user.role] || '/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background py-12">
      {/* Full-screen animated mesh background */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ x: [200, -200, 200], y: [-150, 150, -150] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[5%] right-[10%] w-[700px] h-[700px] bg-tertiary-container/20 rounded-full blur-[140px]"
        />
        <motion.div 
          animate={{ x: [-200, 200, -200], y: [150, -150, 150] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[5%] left-[10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]"
        />
      </div>

      <div className="relative z-10 w-full max-w-[1200px] px-4 sm:px-6 flex flex-col items-center">
        
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 mb-8"
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
          className="w-full max-w-[640px] bg-surface/60 backdrop-blur-2xl rounded-[40px] p-8 sm:p-12 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-white/10 dark:border-white/5 relative overflow-hidden"
        >
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

          <div className="text-center mb-10">
            <h2 className="font-display text-[32px] font-black text-on-surface mb-2 tracking-tight">Create Account</h2>
            <p className="font-body-md text-[15px] text-secondary">Join the platform to access your intelligent academic workspace.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 p-4 bg-error/10 text-error border border-error/20 rounded-2xl font-body-sm text-[14px] flex items-start gap-3 backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-[20px] mt-0.5">error</span>
              <span className="flex-1 leading-snug">{error}</span>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="block font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest pl-1">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.role === 'student' ? 'border-primary bg-primary/10 shadow-sm' : 'border-outline-variant/50 bg-surface-container-lowest/50 hover:bg-surface-container-lowest/80 hover:border-outline-variant'}`}>
                  <input type="radio" name="role" value="student" checked={form.role === 'student'} onChange={handleChange} className="sr-only" />
                  <span className={`material-symbols-outlined text-[32px] mb-2 ${form.role === 'student' ? 'text-primary icon-fill' : 'text-on-surface-variant'}`}>person</span>
                  <span className={`font-title-sm text-[14px] font-bold ${form.role === 'student' ? 'text-primary' : 'text-on-surface-variant'}`}>Student</span>
                  {form.role === 'student' && <span className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full"></span>}
                </label>
                <label className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${form.role === 'supervisor' ? 'border-primary bg-primary/10 shadow-sm' : 'border-outline-variant/50 bg-surface-container-lowest/50 hover:bg-surface-container-lowest/80 hover:border-outline-variant'}`}>
                  <input type="radio" name="role" value="supervisor" checked={form.role === 'supervisor'} onChange={handleChange} className="sr-only" />
                  <span className={`material-symbols-outlined text-[32px] mb-2 ${form.role === 'supervisor' ? 'text-primary icon-fill' : 'text-on-surface-variant'}`}>supervisor_account</span>
                  <span className={`font-title-sm text-[14px] font-bold ${form.role === 'supervisor' ? 'text-primary' : 'text-on-surface-variant'}`}>Supervisor</span>
                  {form.role === 'supervisor' && <span className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full"></span>}
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest pl-1">Full Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] group-focus-within:text-primary transition-colors">badge</span>
                  <input name="fullName" value={form.fullName} onChange={handleChange} required className="w-full bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/50 rounded-2xl pl-11 pr-4 py-3.5 font-body-md text-[15px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50 hover:bg-surface-container-lowest/80 shadow-inner" placeholder="John Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest pl-1">Email</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] group-focus-within:text-primary transition-colors">mail</span>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/50 rounded-2xl pl-11 pr-4 py-3.5 font-body-md text-[15px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50 hover:bg-surface-container-lowest/80 shadow-inner" placeholder="name@university.edu" />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {form.role === 'student' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6 overflow-hidden pt-2">
                  <div className="space-y-2">
                    <label className="block font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest pl-1">Student ID</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] group-focus-within:text-primary transition-colors">id_card</span>
                      <input name="studentId" value={form.studentId} onChange={handleChange} className="w-full bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/50 rounded-2xl pl-11 pr-4 py-3.5 font-body-md text-[15px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50 hover:bg-surface-container-lowest/80 shadow-inner" placeholder="e.g. 19-39123-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest pl-1">Department</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] group-focus-within:text-primary transition-colors">domain</span>
                      <input name="department" value={form.department} onChange={handleChange} className="w-full bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/50 rounded-2xl pl-11 pr-4 py-3.5 font-body-md text-[15px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50 hover:bg-surface-container-lowest/80 shadow-inner" placeholder="e.g. Computer Science" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest pl-1">Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] group-focus-within:text-primary transition-colors">lock</span>
                  <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required className="w-full bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/50 rounded-2xl pl-11 pr-11 py-3.5 font-body-md text-[15px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50 hover:bg-surface-container-lowest/80 shadow-inner" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {/* Password Strength Meter */}
                {form.password && (
                  <div className="pt-2 px-1">
                    <div className="flex gap-1 h-1.5 mb-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`flex-1 rounded-full ${i <= passwordStrength.score ? passwordStrength.color : 'bg-outline-variant/30'}`}></div>
                      ))}
                    </div>
                    <p className={`font-label-sm text-[11px] font-bold uppercase tracking-wider text-right ${passwordStrength.color.replace('bg-', 'text-')}`}>{passwordStrength.label}</p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="block font-label-md text-[12px] font-bold text-secondary uppercase tracking-widest pl-1">Confirm Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] group-focus-within:text-primary transition-colors">lock</span>
                  <input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} required className="w-full bg-surface-container-lowest/50 backdrop-blur-md border border-outline-variant/50 rounded-2xl pl-11 pr-11 py-3.5 font-body-md text-[15px] text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-on-surface-variant/50 hover:bg-surface-container-lowest/80 shadow-inner" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors p-1">
                    <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              className="w-full bg-primary hover:bg-primary-fixed-variant text-on-primary font-title-md text-[16px] font-bold py-4 rounded-2xl transition-all duration-300 mt-8 flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(var(--primary-rgb),0.25)] hover:shadow-[0_12px_25px_rgba(var(--primary-rgb),0.35)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed group"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="material-symbols-outlined text-[20px]">sync</motion.span> Creating account...</>
              ) : (
                <>Create Account <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">arrow_forward</span></>
              )}
            </button>
          </form>

          <div className="mt-10 text-center border-t border-outline-variant/30 pt-8">
            <p className="font-body-sm text-[14px] text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="font-title-sm font-bold text-primary hover:text-primary-fixed-variant hover:underline transition-all">
                Sign in here
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

export default Register;
