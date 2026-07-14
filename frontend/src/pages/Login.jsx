import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/api';

const roleHome = {
  student: '/dashboard',
  supervisor: '/supervisor-dashboard',
  admin: '/admin-dashboard'
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate(roleHome[data.user.role] || '/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center relative font-body-md text-body-md text-on-background">
      <div
        className="absolute inset-0 z-0 bg-surface-container-low"
        style={{
          backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBlhLbFOJlDFqs42oiANIn-P_mLCCNzS0A8ov0p_JL4AeKQKG63n7XPMZJnFiWNH1sS9HOd5nbKBWKiUx8w9YZzhn4_zyN34j_SDhU05NGwLcjAZ2UKqrcn0n8hG1r0FjE8e0VK2LjU8Xc7ErBfPOn7GWNyezniaE3-xIc94oRnwejHTOm27s6sTwlMeUtDJJIl-F3CibXFj5WoBbQpblycW8bi_4H99gQl0flPL9ZY8-PXwVjbdatb75ZjlJYz_rTRsDtTLwrU60Y')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-surface-bright/80 backdrop-blur-md"></div>
      </div>

      <main className="relative z-10 w-full max-w-[440px] px-margin_mobile md:px-0">
        <div className="bg-surface-container-lowest rounded-[24px] shadow-academic border-l-[2px] border-primary p-8 relative overflow-hidden">
          <span className="material-symbols-outlined absolute top-6 right-6 text-primary icon-fill">
            auto_awesome
          </span>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high text-primary mb-4">
              <span className="material-symbols-outlined text-[32px]">
                school
              </span>
            </div>
            <h1 className="font-headline-md text-[24px] font-semibold text-on-surface mb-2">Academic AI</h1>
            <p className="font-body-md text-[16px] text-secondary">Supervision Suite Sign In</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm text-[14px]">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block font-label-md text-[12px] font-semibold text-on-surface-variant mb-1.5" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  mail
                </span>
                <input
                  className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 font-body-md text-[16px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow placeholder:text-outline"
                  id="email"
                  name="email"
                  placeholder="scholar@university.edu"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block font-label-md text-[12px] font-semibold text-on-surface-variant" htmlFor="password">Password</label>
                <a className="font-label-md text-[12px] font-semibold text-primary hover:text-surface-tint transition-colors" href="#">Forgot password?</a>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                  lock
                </span>
                <input
                  className="w-full bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-3 font-body-md text-[16px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow placeholder:text-outline"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              className="w-full bg-primary hover:bg-surface-tint text-on-primary font-title-lg text-[20px] font-semibold py-3 rounded-lg transition-colors duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Login'}
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-variant text-center">
            <p className="font-body-sm text-[14px] text-secondary">
              New to the platform?
              <Link to="/register" className="text-primary font-bold hover:underline transition-all ml-1">Request access</Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="font-label-md text-[12px] font-semibold text-secondary inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            System Operational · Encrypted Connection
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
