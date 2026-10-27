import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const ProfileSettingsPage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useNotifications();

  const [name, setName] = useState(user?.name || 'Alex Chen');
  const [email] = useState(user?.email || 'alex.chen@executive-talent.dev');
  const [title, setTitle] = useState(user?.title || 'Principal / Staff Systems Architect');
  const [targetRole, setTargetRole] = useState(user?.targetRole || 'Staff / Principal Systems Architect');
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || 'Staff');
  const [workMode, setWorkMode] = useState(user?.workModePreference || 'Remote');
  const [minSalary, setMinSalary] = useState(user?.minSalaryTarget || 245000);
  const [bio, setBio] = useState(user?.bio || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);
  const [autoAgentEnabled, setAutoAgentEnabled] = useState(user?.autoAgentEnabled ?? true);
  const [humanApprovalRequired, setHumanApprovalRequired] = useState(user?.humanApprovalRequired ?? true);

  const [saveLoading, setSaveLoading] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      await updateProfile({
        name,
        title,
        targetRole,
        experienceLevel: experienceLevel as any,
        workModePreference: workMode as any,
        minSalaryTarget: minSalary,
        bio,
        notificationsEnabled,
        autoAgentEnabled,
        humanApprovalRequired,
      });
      showToast('Profile and preferences updated successfully!', 'success');
    } catch {
      showToast('Failed to save profile changes.', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
      {/* Page Title */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
          Profile & Career Settings
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Configure your executive target roles, algorithmic matching preferences, and zero-trust security policies.
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-8">
        {/* Profile Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-surface-container-high flex flex-col gap-6">
          <div className="flex items-center gap-4 pb-6 border-b border-surface-container">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <h2 className="font-display text-base font-bold text-on-surface">{name}</h2>
              <span className="text-xs text-on-surface-variant font-mono">{email}</span>
              <span className="font-mono text-[11px] text-primary font-bold mt-1">Verified Candidate Account</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high text-xs text-on-surface focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Account Email (Verified)</label>
              <input
                type="email"
                value={email}
                disabled
                className="bg-surface-container-low/50 px-3 py-2.5 rounded-xl border border-surface-container-high text-xs text-outline cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Current Professional Headline</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Target Search Role</label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-on-surface">Professional Executive Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-surface-container-low p-3 rounded-xl border border-surface-container-high text-xs text-on-surface focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Career Preferences */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-surface-container-high flex flex-col gap-6">
          <h3 className="font-display text-base font-bold text-on-surface pb-3 border-b border-surface-container">
            Target Compensation & Work Mode
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Experience Seniority Tier</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                className="bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high text-xs text-on-surface focus:outline-none"
              >
                <option value="Senior">Senior (L5)</option>
                <option value="Lead">Lead Engineer</option>
                <option value="Staff">Staff Systems Architect (L6)</option>
                <option value="Principal">Principal Systems Architect (L7+)</option>
                <option value="Executive">VP / Head of Infrastructure</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Work Mode Requirement</label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value as any)}
                className="bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high text-xs text-on-surface focus:outline-none"
              >
                <option value="Remote">Remote Only</option>
                <option value="Hybrid">Hybrid (1-2 days / wk)</option>
                <option value="Onsite">Onsite</option>
                <option value="Any">Flexible / Any</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Target Minimum Base ($ USD)</label>
              <input
                type="number"
                value={minSalary}
                onChange={(e) => setMinSalary(Number(e.target.value))}
                step={5000}
                className="bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high text-xs font-mono text-on-surface focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Security & Agent Controls */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-surface-container-high flex flex-col gap-6">
          <h3 className="font-display text-base font-bold text-on-surface pb-3 border-b border-surface-container">
            Security & Autonomous Agent Toggles
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/70 cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Enforce Human Approval Gate (Zero-Blind Dispatch)</span>
                <span className="text-[11px] text-on-surface-variant">
                  Guarantee that no application packet is sent without cryptographic candidate sign-off.
                </span>
              </div>
              <input
                type="checkbox"
                checked={humanApprovalRequired}
                onChange={(e) => setHumanApprovalRequired(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/70 cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Continuous Background ATS Scanning Daemon</span>
                <span className="text-[11px] text-on-surface-variant">
                  Run automated evaluation daemon for real-time Greenhouse, Lever, and Ashby requisitions.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoAgentEnabled}
                onChange={(e) => setAutoAgentEnabled(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl bg-surface-container-low/70 cursor-pointer">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-on-surface">Real-Time In-App & Email Notifications</span>
                <span className="text-[11px] text-on-surface-variant">
                  Receive alerts when roles exceeding 90% affinity are discovered or require human gate sign-off.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 text-primary rounded"
              />
            </label>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-container">
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
          >
            Sign Out of Account
          </button>

          <button
            type="submit"
            disabled={saveLoading}
            className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs shadow-md transition-all flex items-center gap-2"
          >
            {saveLoading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={logoutConfirmOpen}
        title="Sign Out"
        message="Are you sure you want to end your current session? You will need to sign in again to access your dashboard."
        confirmLabel="Sign Out"
        variant="danger"
        onConfirm={async () => {
          setLogoutConfirmOpen(false);
          await logout();
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
};
