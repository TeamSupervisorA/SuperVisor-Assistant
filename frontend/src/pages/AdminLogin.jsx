import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/admin-dashboard');
      } else {
        setError(data.error || 'Failed to login');
      }
    } catch (err) {
      setError('An error occurred while logging in.');
    }
  };

  return (
    <div className="min-h-screen bg-inverse-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-error"></div>
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="font-headline-lg text-[32px] font-bold text-on-surface mb-2">Admin Gateway</h1>
            <p className="font-body-md text-[16px] text-error font-medium">Restricted Access Area</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm text-[14px]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block font-label-md text-[12px] font-semibold text-on-surface uppercase tracking-wider mb-2">
                Administrator ID (Email)
              </label>
              <input 
                type="email" 
                required
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface focus:border-error focus:ring-1 focus:ring-error font-body-md text-[16px]"
                placeholder="admin@institution.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block font-label-md text-[12px] font-semibold text-on-surface uppercase tracking-wider mb-2">
                Secure Password
              </label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface focus:border-error focus:ring-1 focus:ring-error font-body-md text-[16px]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-error text-on-error font-title-lg text-[20px] font-semibold py-3 px-4 rounded-lg hover:bg-on-error-container transition-colors shadow-md"
            >
              Authenticate
            </button>
          </form>

          <div className="mt-8 text-center border-t border-outline-variant pt-6">
            <button 
              onClick={() => navigate('/login')}
              className="text-outline font-label-md text-[12px] font-semibold uppercase tracking-wider hover:text-on-surface transition-colors"
            >
              ← Return to Standard Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
