import React, { useState } from 'react';
import { ImprovementSuggestion } from '../types';
import { INITIAL_IMPROVEMENTS } from '../services/mockData';
import { useNotifications } from '../context/NotificationContext';
import { useResume } from '../context/ResumeContext';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const AiResumeImprovementPage: React.FC = () => {
  const { showToast } = useNotifications();
  const { resume } = useResume();

  const [suggestions, setSuggestions] = useState<ImprovementSuggestion[]>(() => {
    if (resume.actionableSuggestions && resume.actionableSuggestions.length > 0) {
      return resume.actionableSuggestions.map((as, idx) => ({
        id: as.id || `sug_${idx}`,
        roleContext: resume.targetRole || 'Software Engineer',
        companyContext: 'Extracted from Resume Content',
        category: 'ATS Alignment' as const,
        original: 'Current bullet or section in extracted resume',
        suggested: as.description || as.title,
        reason: as.title,
        scoreGain: as.severity === 'High' ? 3.0 : 1.5,
        targetKeywords: ['Metrics', 'Impact'],
        status: 'pending' as const,
      }));
    }
    return INITIAL_IMPROVEMENTS;
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // Compute live score dynamically based on accepted suggestions and real resume score
  const baseScore = resume.overallScore || 80;
  const acceptedGain = suggestions
    .filter((s) => s.status === 'accepted')
    .reduce((acc, curr) => acc + curr.scoreGain, 0);
  const currentScore = Math.min(100, Math.round((baseScore + acceptedGain) * 10) / 10);
  const pendingCount = suggestions.filter((s) => s.status === 'pending').length;

  const handleAccept = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'accepted' } : s))
    );
    showToast('Suggestion accepted! Projected score updated.', 'success');
  };

  const handleReject = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'rejected' } : s))
    );
    showToast('Suggestion dismissed.', 'info');
  };

  const handleStartEdit = (suggestion: ImprovementSuggestion) => {
    setEditingId(suggestion.id);
    setEditText(suggestion.customText || suggestion.suggested);
  };

  const handleSaveEdit = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, customText: editText, isEdited: true } : s
      )
    );
    setEditingId(null);
    showToast('Custom edits saved.', 'info');
  };

  const handleResetAll = () => {
    setSuggestions(INITIAL_IMPROVEMENTS.map((s) => ({ ...s, status: 'pending', customText: undefined, isEdited: false })));
    setResetModalOpen(false);
    showToast('All diff suggestions restored to default baseline.', 'info');
  };

  return (
    <div className="w-full flex flex-col">
      {/* Top Context & Progress Sub-Header */}
      <div className="w-full bg-surface-container-low px-4 sm:px-8 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-surface-container-high/60">
        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest text-primary font-mono font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            DIFF-ENGINE V4.2
          </span>
          <span className="text-on-surface-variant font-medium">Session #R2H-89410</span>
          <span className="text-outline">/</span>
          <span className="text-on-surface-variant">Tailoring Stage 3 of 4: Bullet Optimization</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant">Pending Review:</span>
            <span className="font-mono px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold">
              {pendingCount} Suggestions Pending
            </span>
          </div>

          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="text-on-surface-variant hover:text-on-surface font-semibold flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Reset
          </button>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-8 flex flex-col gap-8">
        {/* Target Job Header & Telemetry Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Role & Company Identity */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-surface-container-high flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary font-mono text-[11px] font-bold uppercase">
                  Target Job Match
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-[11px]">
                  REQ-2025-9921
                </span>
                <span className="flex items-center gap-1 text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">verified</span>
                  Enterprise Verified
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center text-white font-display text-lg font-bold shadow-md shrink-0">
                  DD
                </div>
                <div className="flex flex-col min-w-0">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-on-surface tracking-tight truncate">
                    Principal Platform Architect
                  </h1>
                  <p className="text-xs text-on-surface-variant flex items-center gap-2 mt-1">
                    <span className="font-bold text-on-surface">Datadog, Inc.</span>
                    <span>•</span>
                    <span>New York, NY (Hybrid)</span>
                    <span>•</span>
                    <span className="font-mono text-primary font-bold">$265k - $320k base + Equity</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 bg-surface-container-low/70 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-[18px]">tune</span>
                <span>
                  Parsing Model: <strong className="text-on-surface">Llama-3-Recruiter-70B</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-outline font-mono text-[10px] uppercase">Keywords Detected:</span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-mono text-[10px]">
                  Kubernetes
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-mono text-[10px]">
                  FinOps
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface font-mono text-[10px]">
                  Telemetry
                </span>
              </div>
            </div>
          </div>

          {/* Match Score Dynamics Gauge Card */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-on-surface-variant font-bold block">
                  Relevance Engine
                </span>
                <h3 className="font-display text-base font-bold text-on-surface">Match Projection</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-mono text-xs font-bold">
                +{acceptedGain.toFixed(1)}% Achieved Gain
              </span>
            </div>

            <div className="my-4 grid grid-cols-2 items-center gap-4">
              {/* Circular SVG Gauge */}
              <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-surface-container fill-none"
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                  />
                  {/* Base track */}
                  <circle
                    className="text-secondary stroke-current fill-none transition-all duration-700"
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (baseScore / 100) * 251.2}
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                  {/* Current with accepted gain */}
                  <circle
                    className="text-primary stroke-current fill-none transition-all duration-700 opacity-70"
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (currentScore / 100) * 251.2}
                    strokeLinecap="round"
                    strokeWidth="8"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold text-on-surface leading-none">
                    {currentScore}%
                  </span>
                  <span className="text-[10px] text-outline font-mono uppercase mt-0.5">Projected</span>
                </div>
              </div>

              {/* Delta telemetry bars */}
              <div className="flex flex-col gap-2">
                <div className="bg-surface-container-low rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-on-surface-variant">Baseline Score</span>
                    <span className="font-mono font-bold text-on-surface">{baseScore}%</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: `${baseScore}%` }}></div>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-xl p-2.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-on-surface-variant">Potential Peak</span>
                    <span className="font-mono font-bold text-primary">98% (+6.0%)</span>
                  </div>
                  <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <span className="text-[11px] text-outline text-center">
              Target role threshold is 94% for priority executive routing.
            </span>
          </div>
        </div>

        {/* Clear Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-surface-container-low border border-primary/20 flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0">info</span>
          <p className="text-xs text-on-surface leading-relaxed">
            <strong className="text-primary font-bold">Explicit Approval Required:</strong> Suggestions generated below are isolated diff previews. They will <span className="underline font-semibold">never</span> be applied to your base resume or sent to recruiters until you click Accept or save your custom edits.
          </p>
        </div>

        {/* Side-by-Side Diff Suggestions List */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-on-surface">
              Tailoring Suggestions ({suggestions.length})
            </h2>
            <span className="text-xs text-on-surface-variant">
              Llama-3-Recruiter-70B Prompt: Executive Precision v4
            </span>
          </div>

          {suggestions.map((sugg, index) => {
            const isEditing = editingId === sugg.id;
            const displayText = sugg.customText || sugg.suggested;

            return (
              <div
                key={sugg.id}
                className={`bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border transition-all ${
                  sugg.status === 'accepted'
                    ? 'border-emerald-300 ring-2 ring-emerald-100'
                    : sugg.status === 'rejected'
                    ? 'border-surface-container-high opacity-60'
                    : 'border-surface-container-high hover:border-primary/40'
                }`}
              >
                {/* Suggestion Card Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-surface-container">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center font-mono text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-xs font-bold text-on-surface">{sugg.roleContext}</span>
                    <span className="text-outline text-xs">•</span>
                    <span className="text-xs text-on-surface-variant">{sugg.companyContext}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-surface-container">
                      +{sugg.scoreGain}% Gain
                    </span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                        sugg.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sugg.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sugg.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Diff Comparison Body */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
                  {/* Original Bullet */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-surface-container-low/50 border border-surface-container-high">
                    <span className="text-[10px] font-mono uppercase font-bold text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">remove_circle_outline</span>
                      Original Resume Bullet
                    </span>
                    <p className="text-xs text-on-surface-variant leading-relaxed line-through decoration-rose-400">
                      {sugg.original}
                    </p>
                  </div>

                  {/* Suggested AI Bullet */}
                  <div className="flex flex-col gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase font-bold text-primary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        AI-Optimized Replacement
                      </span>
                      {sugg.isEdited && (
                        <span className="text-[10px] font-mono text-secondary font-semibold">Custom Edited</span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                          className="w-full p-2.5 bg-surface-container-lowest text-xs text-on-surface rounded-lg border border-primary focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 text-xs text-on-surface-variant hover:underline"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(sugg.id)}
                            className="px-3 py-1 bg-primary text-on-primary rounded text-xs font-semibold"
                          >
                            Save Edits
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface font-medium leading-relaxed">
                        {displayText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Why & Keywords */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-surface-container text-xs">
                  <div className="flex flex-col gap-1 max-w-xl">
                    <span className="text-[11px] text-on-surface-variant">
                      <strong className="text-on-surface">Rationale:</strong> {sugg.reason}
                    </span>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="text-[10px] uppercase font-mono text-outline">Target Keywords:</span>
                      {sugg.targetKeywords.map((kw) => (
                        <span
                          key={kw}
                          className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-surface-container text-on-surface"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(sugg)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Edit
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleReject(sugg.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        sugg.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'text-outline hover:text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      Dismiss
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAccept(sugg.id)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 ${
                        sugg.status === 'accepted'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-primary hover:bg-primary-container text-on-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {sugg.status === 'accepted' ? 'check' : 'thumb_up'}
                      </span>
                      {sugg.status === 'accepted' ? 'Accepted' : 'Accept Suggestion'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        isOpen={resetModalOpen}
        title="Reset All Diff Suggestions"
        message="Restore all bullet point suggestions to their pending baseline? Any custom edits you made will be cleared."
        confirmLabel="Reset All"
        variant="danger"
        onConfirm={handleResetAll}
        onCancel={() => setResetModalOpen(false)}
      />
    </div>
  );
};
