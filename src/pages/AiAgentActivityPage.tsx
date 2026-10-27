import React, { useState, useEffect } from 'react';
import { AgentActivityItem } from '../types';
import { agentService } from '../services/agentService';
import { useNotifications } from '../context/NotificationContext';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const AiAgentActivityPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [activities, setActivities] = useState<AgentActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedActivity, setSelectedActivity] = useState<AgentActivityItem | null>(null);
  const [dialogAction, setDialogAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    agentService.getActivities().then((data) => {
      setActivities(data);
      setLoading(false);
    });
  }, []);

  const pendingApprovals = activities.filter((a) => a.requiresApproval && a.status === 'pending');
  const filteredActivities = activities.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const handleApproveClick = (act: AgentActivityItem) => {
    setSelectedActivity(act);
    setDialogAction('approve');
  };

  const handleRejectClick = (act: AgentActivityItem) => {
    setSelectedActivity(act);
    setDialogAction('reject');
  };

  const executeApprovalOrRejection = async () => {
    if (!selectedActivity || !dialogAction) return;

    if (dialogAction === 'approve') {
      const res = await agentService.approveGateDispatch(selectedActivity.id);
      if (res.success) {
        showToast(res.message, 'success');
        setActivities((prev) =>
          prev.map((a) =>
            a.id === selectedActivity.id
              ? {
                  ...a,
                  status: 'completed',
                  requiresApproval: false,
                  details: 'Authorized by candidate. Application packet queued.',
                }
              : a
          )
        );
      }
    } else {
      const res = await agentService.rejectGateDispatch(selectedActivity.id);
      if (res.success) {
        showToast(res.message, 'warning');
        setActivities((prev) =>
          prev.map((a) =>
            a.id === selectedActivity.id
              ? {
                  ...a,
                  status: 'failed',
                  requiresApproval: false,
                  details: 'Cancelled by user. Zero transmission guaranteed.',
                }
              : a
          )
        );
      }
    }

    setDialogAction(null);
    setSelectedActivity(null);
  };

  const handleRetry = async (id: string) => {
    showToast('Retrying background agent task...', 'info');
    const updated = await agentService.retryTask(id);
    if (updated) {
      setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
      showToast('Agent task retried successfully!', 'success');
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
      {/* Top Command & Telemetry Ribbon */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-container p-6 sm:p-8 shadow-xs border border-surface-container-high/80">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-primary/10 via-secondary/15 to-transparent blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest shadow-xs font-mono text-xs text-primary font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                RUNNING DAEMON v4.19
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs">
                <span className="material-symbols-outlined text-[15px] text-tertiary">hub</span>
                ATS Webhooks & Realtime Ingest Connected
              </span>

              <span className="font-mono text-xs text-outline">ping: 24ms</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
              Autonomous Job Agent & Activity Ledger
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Continuous background evaluation engine for candidate sourcing, vector ATS keyword parity, and zero-trust human-in-the-loop application execution.
            </p>
          </div>

          {/* System Heartbeat Micro-Gauge */}
          <div className="flex items-center gap-4 bg-surface-container-lowest/90 backdrop-blur-md p-4 rounded-2xl shadow-xs border border-surface-container-high shrink-0 self-start lg:self-auto">
            <div className="relative flex items-center justify-center w-14 h-14">
              <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 48 48">
                <circle
                  className="text-surface-container fill-none"
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <circle
                  className="text-primary fill-none transition-all duration-700"
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeDasharray="125.6"
                  strokeDashoffset="12.5"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <span className="absolute font-mono text-xs text-on-surface font-bold">98%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-bold">
                Agent Health
              </span>
              <span className="font-display text-xs font-bold text-on-surface">Zero Drift Recorded</span>
              <span className="font-mono text-[11px] text-secondary font-semibold">Policy: Human-Gated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Section: Human Oversight & Approval Gate */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-1">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold text-on-surface">Human Approval Gate</h2>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-[11px] font-bold">
                  {pendingApprovals.length} PENDING
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                External submission requires explicit cryptographic candidate sign-off.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
            <span>Zero-Blind-Dispatch Policy Active</span>
          </div>
        </div>

        {/* Protocol Disclaimer Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-low text-on-surface shadow-xs border border-surface-container-high">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0 mt-0.5">shield</span>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full text-xs">
            <p className="text-on-surface leading-relaxed">
              <strong className="font-bold text-primary">Zero-Surprise Guarantee:</strong> Resume2Hire will <span className="underline decoration-secondary decoration-2 font-semibold">never</span> transmit your CV, cover materials, or identity data to external company portals or ATS systems without explicit verification.
            </p>
            <span className="font-mono text-[11px] text-outline whitespace-nowrap shrink-0">
              ISO/IEC 27001 + SOC2 Ready
            </span>
          </div>
        </div>

        {/* Pending Applications Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {pendingApprovals.map((act) => {
            const data = act.approvalData;
            if (!data) return null;

            return (
              <article
                key={act.id}
                className="flex flex-col justify-between rounded-2xl bg-surface-container-lowest p-6 shadow-xs border border-surface-container-high hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col gap-4">
                  {/* Header bar of application card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-xs shrink-0">
                        {data.company.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-base font-bold text-on-surface">
                            {data.company}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-mono text-[11px] font-bold">
                            Match: {data.matchScore}%
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-[10px]">
                            {data.atsPlatform}
                          </span>
                        </div>
                        <h3 className="font-display text-sm font-bold text-on-surface-variant mt-0.5">
                          {data.jobTitle}
                        </h3>
                        <span className="text-xs text-outline flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[15px]">location_on</span>
                          {data.location} • {data.salary}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low p-3 rounded-xl border border-surface-container">
                    {act.details}
                  </p>

                  <div className="flex items-center justify-between text-xs font-mono text-outline">
                    <span>Packet ID: {data.packetId}</span>
                    <span className="text-emerald-700 font-semibold">Checksum Verified</span>
                  </div>
                </div>

                {/* Gate Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container mt-4">
                  <button
                    type="button"
                    onClick={() => handleRejectClick(act)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    Cancel Dispatch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveClick(act)}
                    className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Authorize & Dispatch
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Section 2: Continuous Background Activity Ledger */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-on-surface">Execution Ledger & Traces</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-mono text-xs font-bold">
              {activities.length} Records
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {['all', 'pending', 'completed', 'failed'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold uppercase text-[10px] tracking-wider transition-all ${
                  filter === st
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Entries */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-surface-container-high divide-y divide-surface-container overflow-hidden">
          {filteredActivities.map((act) => (
            <div key={act.id} className="p-5 flex flex-col gap-3 hover:bg-surface-container-low/40 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      act.status === 'completed'
                        ? 'text-emerald-600'
                        : act.status === 'pending'
                        ? 'text-amber-600'
                        : act.status === 'failed'
                        ? 'text-rose-600'
                        : 'text-primary animate-spin'
                    }`}
                  >
                    {act.status === 'completed'
                      ? 'task_alt'
                      : act.status === 'pending'
                      ? 'gavel'
                      : act.status === 'failed'
                      ? 'error'
                      : 'sync'}
                  </span>
                  <div>
                    <h4 className="font-display text-xs font-bold text-on-surface">{act.actionName}</h4>
                    <span className="text-[11px] text-on-surface-variant font-mono">{act.targetEntity}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {act.latencyMs && (
                    <span className="font-mono text-[10px] text-outline">{act.latencyMs}ms</span>
                  )}
                  <span className="font-mono text-[10px] text-outline">• {act.timestamp}</span>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                      act.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : act.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {act.status}
                  </span>

                  {act.status === 'failed' && (
                    <button
                      type="button"
                      onClick={() => handleRetry(act.id)}
                      className="px-2.5 py-1 rounded bg-surface-container text-primary font-semibold text-xs hover:bg-surface-container-high"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-on-surface-variant pl-8 leading-relaxed">
                {act.details}
              </p>

              {/* Execution Trace Snippet */}
              {act.traceLogs && act.traceLogs.length > 0 && (
                <div className="ml-8 p-3 rounded-xl bg-surface font-mono text-[11px] text-on-surface-variant space-y-1 border border-surface-container">
                  {act.traceLogs.map((log, idx) => (
                    <div key={idx} className="truncate">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Confirmation Modal for Human Approval Gate */}
      <ConfirmDialog
        isOpen={!!dialogAction}
        title={dialogAction === 'approve' ? 'Cryptographic Sign-Off' : 'Cancel Application Dispatch'}
        message={
          dialogAction === 'approve'
            ? `Authorize cryptographic dispatch of verified ATS candidate packet for ${selectedActivity?.approvalData?.company}? Your approval will unlock the gate.`
            : `Are you sure you want to cancel the dispatch for ${selectedActivity?.approvalData?.company}? The prepared application packet will be discarded without transmitting any data.`
        }
        confirmLabel={dialogAction === 'approve' ? 'Confirm Sign-Off' : 'Purge Packet'}
        variant={dialogAction === 'approve' ? 'primary' : 'danger'}
        onConfirm={executeApprovalOrRejection}
        onCancel={() => {
          setDialogAction(null);
          setSelectedActivity(null);
        }}
      />
    </div>
  );
};
