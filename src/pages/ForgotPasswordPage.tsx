import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await authService.resetPassword(email);
    setLoading(false);
    setMessage(res.message);
    setSubmitted(res.success);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-surface to-surface-container-low/40">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-8 shadow-xl border border-surface-container-high/70 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[26px]">key</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
            Reset Account Password
          </h1>
          <p className="text-xs text-on-surface-variant max-w-xs leading-relaxed">
            Enter your verified email to receive a secure cryptographic recovery link.
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-display font-bold text-sm text-on-surface">Reset Link Dispatched</h4>
              <p className="text-xs text-on-surface-variant">{message}</p>
            </div>
            <Link
              to="/login"
              className="mt-2 w-full py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-xs text-center shadow-sm"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Registered Email</label>
              <div className="flex items-center bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high focus-within:border-primary transition-all">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span>Transmit Recovery Link</span>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-surface-container text-xs text-on-surface-variant">
          Remember your credentials?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
