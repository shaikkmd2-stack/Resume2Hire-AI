import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { showToast } = useNotifications();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetRole, setTargetRole] = useState('Staff / Principal Systems Architect');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !email || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (!termsAccepted) {
      setFormError('Please accept the Terms of Service and Zero-Surprise policy.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup(name, email, password, targetRole);
      if (res.success) {
        showToast('Account created successfully! Welcome to Resume2Hire AI.', 'success');
        navigate('/resume-analysis');
      } else {
        setFormError(res.error || 'Failed to create account.');
      }
    } catch {
      setFormError('An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-surface to-surface-container-low/40">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl p-8 shadow-xl border border-surface-container-high/70 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-[26px]">person_add</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-on-surface tracking-tight">
            Create Your Executive Account
          </h1>
          <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
            Autonomous talent discovery with zero-blind dispatch and human sign-off.
          </p>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Full Name</label>
              <div className="flex items-center bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high focus-within:border-primary transition-all">
                <span className="material-symbols-outlined text-[18px] text-outline mr-2">badge</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Chen"
                  className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Work Email</label>
              <div className="flex items-center bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high focus-within:border-primary transition-all">
                <span className="material-symbols-outlined text-[18px] text-outline mr-2">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@tech.io"
                  className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface">Target Professional Role</label>
            <div className="flex items-center bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-[18px] text-outline mr-2">work</span>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Staff / Principal Systems Architect"
                className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface">Password</label>
            <div className="flex items-center bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high focus-within:border-primary transition-all">
              <span className="material-symbols-outlined text-[18px] text-outline mr-2">lock</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 rounded text-primary focus:ring-primary"
            />
            <span className="text-[11px] text-on-surface-variant leading-relaxed">
              I agree to the Terms of Service and acknowledge the{' '}
              <strong className="text-on-surface">Zero-Surprise Guarantee</strong>: Resume2Hire will never submit applications without my explicit sign-off.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Complete Registration & Launch</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-surface-container text-xs text-on-surface-variant">
          Already registered?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
