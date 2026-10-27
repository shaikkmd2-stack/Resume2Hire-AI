import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useNotifications();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        showToast('Signed in successfully. Welcome back!', 'success');
        navigate('/dashboard');
      } else {
        setFormError(res.error || 'Invalid credentials.');
      }
    } catch {
      setFormError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('alex.chen@executive-talent.dev');
    setPassword('ExecutivePass2026!');
    setFormError(null);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-surface to-surface-container-low/40">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-8 shadow-xl border border-surface-container-high/70 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-[26px]">lock_open</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
            Sign In to Resume2Hire <span className="text-primary">AI</span>
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
            Access your ATS resume scoring, algorithmic match matrix, and background agent ledger.
          </p>
        </div>

        {/* Demo Fast Track Pill */}
        <button
          type="button"
          onClick={fillDemoAccount}
          className="w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high border border-primary/20 text-xs font-semibold text-primary transition-all flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[16px]">bolt</span>
          <span>Quick-Fill Demo Account (Alex Chen · Staff)</span>
        </button>

        {/* Error Alert */}
        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface">Email Address</label>
            <div className="flex items-center bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-[18px] text-outline mr-2">mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex.chen@example.com"
                className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-on-surface">Password</label>
              <Link to="/forgot-password" className="text-[11px] font-semibold text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="flex items-center bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <span className="material-symbols-outlined text-[18px] text-outline mr-2">lock</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In to Executive Console</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-surface-container text-xs text-on-surface-variant">
          Don't have an account yet?{' '}
          <Link to="/signup" className="text-primary font-bold hover:underline">
            Create account free
          </Link>
        </div>
      </div>
    </div>
  );
};
