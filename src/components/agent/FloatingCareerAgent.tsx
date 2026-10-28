import React, { useState, useRef, useEffect } from 'react';
import { useAgent } from '../../context/AgentContext';
import { JobItem, JobApplication } from '../../types';

export const FloatingCareerAgent: React.FC = () => {
  const {
    isOpen,
    isMinimized,
    messages,
    isThinking,
    activeTool,
    pendingConfirmation,
    actionHistory,
    toggleOpen,
    toggleMinimize,
    sendMessage,
    confirmAction,
    cancelAction,
    clearHistory,
  } = useAgent();

  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isThinking, activeTool]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      {/* 1. Floating Launch Trigger Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={toggleOpen}
          aria-label="Open Resume2Hire AI Agent"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group border border-white/20"
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px] animate-pulse">auto_awesome</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-primary"></span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-display text-xs font-bold tracking-tight leading-tight">Resume2Hire AI Agent</span>
            <span className="text-[10px] text-white/80 font-mono leading-tight">Career Action Copilot</span>
          </div>
        </button>
      )}

      {/* 2. Floating Chat Panel */}
      {isOpen && (
        <div
          className={`fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high flex flex-col overflow-hidden transition-all duration-200 backdrop-blur-xl ${
            isMinimized ? 'h-16' : 'h-[620px] max-h-[calc(100vh-2rem)]'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-high border-b border-surface-container-high flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-xs shrink-0">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-xs font-bold text-on-surface truncate">
                    Resume2Hire AI Agent
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold">
                    AUTONOMOUS
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant truncate">
                  Action-Taking Career Copilot
                </span>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1 shrink-0 text-on-surface-variant">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                title="Action History Ledger"
                className={`p-1.5 rounded-lg hover:bg-surface-container-lowest transition-colors ${
                  showHistory ? 'text-primary bg-surface-container-lowest' : ''
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
              </button>
              <button
                type="button"
                onClick={clearHistory}
                title="Clear Conversation"
                className="p-1.5 rounded-lg hover:bg-surface-container-lowest transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              </button>
              <button
                type="button"
                onClick={toggleMinimize}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 rounded-lg hover:bg-surface-container-lowest transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isMinimized ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              <button
                type="button"
                onClick={toggleOpen}
                title="Close"
                className="p-1.5 rounded-lg hover:bg-surface-container-lowest hover:text-error transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Action History Overlay Drawer */}
              {showHistory && (
                <div className="p-3 bg-surface-container-low border-b border-surface-container-high max-h-48 overflow-y-auto text-xs animate-in slide-in-from-top duration-150">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-on-surface flex items-center gap-1 font-mono text-[11px]">
                      <span className="material-symbols-outlined text-[14px] text-primary">receipt_long</span>
                      VERIFIED ACTION HISTORY
                    </span>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      Close
                    </button>
                  </div>
                  {actionHistory.length === 0 ? (
                    <p className="text-[11px] text-on-surface-variant italic">No tools executed in this session yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {actionHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-2 rounded-lg bg-surface-container-lowest border border-surface-container-high flex items-center justify-between text-[11px]"
                        >
                          <span className="font-mono font-semibold text-on-surface truncate">
                            {item.action}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-1.5 py-0.2 rounded bg-surface-container font-mono text-[10px] text-primary">
                              {item.result}
                            </span>
                            <span className="text-[10px] text-outline font-mono">{item.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Message List Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface-container-lowest/50 text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1.5 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender Label & Timestamp */}
                    <div className="flex items-center gap-1.5 px-1 text-[10px] text-on-surface-variant">
                      <span className="font-semibold">{msg.sender === 'user' ? 'You' : 'Resume2Hire AI'}</span>
                      <span>•</span>
                      <span className="font-mono">{msg.timestamp}</span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`p-3.5 rounded-2xl max-w-[92%] leading-relaxed whitespace-pre-line shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-primary text-on-primary rounded-tr-xs'
                          : 'bg-surface-container-low text-on-surface rounded-tl-xs border border-surface-container-high'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Structured Result Cards */}
                    {msg.structuredData?.jobs && msg.structuredData.jobs.length > 0 && (
                      <div className="w-full mt-2 space-y-2">
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                          Verified Top Matches:
                        </span>
                        {msg.structuredData.jobs.map((job: JobItem) => (
                          <div
                            key={job.id}
                            className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col gap-2 hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-display font-bold text-xs text-on-surface">{job.title}</h4>
                                <p className="text-[11px] text-on-surface-variant">
                                  {job.company} • {job.location}
                                </p>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] shrink-0">
                                {job.matchScore}% Match
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1 border-t border-surface-container">
                              <span className="font-mono">{job.salaryRange}</span>
                              <button
                                type="button"
                                onClick={() => sendMessage(`Apply to ${job.company}`)}
                                className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-[10px] font-semibold transition-all flex items-center gap-1 shadow-xs"
                              >
                                <span className="material-symbols-outlined text-[12px]">send</span>
                                Apply with Agent
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Applications List Card */}
                    {msg.structuredData?.applications && msg.structuredData.applications.length > 0 && (
                      <div className="w-full mt-2 space-y-1.5">
                        <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">
                          Tracked Pipeline Records:
                        </span>
                        {msg.structuredData.applications.map((app: JobApplication) => (
                          <div
                            key={app.id}
                            className="p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high flex items-center justify-between text-xs"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-on-surface truncate">{app.jobTitle}</span>
                              <span className="text-[11px] text-on-surface-variant truncate">{app.company}</span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase shrink-0 ${
                                app.status === 'offer'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : app.status === 'interviewing'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-indigo-100 text-primary'
                              }`}
                            >
                              {app.status.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interview Prep Questions Card */}
                    {msg.structuredData?.interviewQuestions && (
                      <div className="w-full mt-2 space-y-2">
                        {msg.structuredData.interviewQuestions.map((iq: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high flex flex-col gap-1.5"
                          >
                            <span className="font-mono text-[10px] font-bold text-primary uppercase">
                              {iq.category}
                            </span>
                            <p className="font-bold text-on-surface text-xs">{iq.question}</p>
                            <p className="text-[11px] text-on-surface-variant bg-surface-container-low p-2 rounded-lg leading-relaxed">
                              💡 <strong>Tip:</strong> {iq.answerTips}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Skill Gap Card */}
                    {msg.structuredData?.skillGaps && (
                      <div className="w-full mt-2 p-3 rounded-xl bg-surface-container-lowest border border-surface-container-high flex flex-col gap-2">
                        <div>
                          <span className="font-bold text-emerald-700 text-[11px] block mb-1">
                            ✓ Verified Matched Skills:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {msg.structuredData.skillGaps.matched.map((s: string) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {msg.structuredData.skillGaps.missing.length > 0 && (
                          <div>
                            <span className="font-bold text-amber-700 text-[11px] block mb-1">
                              ⚠ Missing / Unstated Stack:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {msg.structuredData.skillGaps.missing.map((s: string) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-mono text-[10px]"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-[11px] text-on-surface-variant mt-1 border-t border-surface-container pt-1.5">
                          {msg.structuredData.skillGaps.recommendation}
                        </p>
                      </div>
                    )}

                    {/* Next Steps Checklist Card */}
                    {msg.structuredData?.nextSteps && (
                      <div className="w-full mt-2 space-y-1.5">
                        {msg.structuredData.nextSteps.map((step: any) => (
                          <div
                            key={step.step}
                            className="p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high flex items-start gap-2.5"
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5 ${
                                step.urgent
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-surface-container text-on-surface'
                              }`}
                            >
                              {step.step}
                            </span>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-on-surface text-xs">{step.title}</span>
                              <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                                {step.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Confirmation Review Card (Prompt Phase 9 & 14) */}
                    {msg.confirmationRequest && msg.confirmationRequest.status === 'pending' && (
                      <div className="w-full mt-2 p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border border-primary/30 shadow-md flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs">
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                          <span>HUMAN CONFIRMATION REQUIRED</span>
                        </div>

                        <div className="flex flex-col gap-1 text-xs">
                          <span className="font-bold text-on-surface">{msg.confirmationRequest.title}</span>
                          <p className="text-[11px] text-on-surface-variant leading-relaxed">
                            {msg.confirmationRequest.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 font-mono text-[10px] text-outline">
                            <span>Destination: {msg.confirmationRequest.destinationType}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => cancelAction(msg.confirmationRequest!.id)}
                            className="flex-1 py-2 px-3 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmAction(msg.confirmationRequest!.id)}
                            className="flex-1 py-2 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">task_alt</span>
                            Confirm & Record
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Suggested Follow-up Quick Action Chips */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.suggestedActions.map((actionText) => (
                          <button
                            key={actionText}
                            type="button"
                            onClick={() => sendMessage(actionText)}
                            className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-[10px] font-semibold transition-all border border-surface-container-high hover:border-primary/40 text-left"
                          >
                            {actionText}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Active Tool Execution Indicator */}
                {isThinking && (
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center gap-3 animate-pulse text-xs text-on-surface-variant">
                    <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin shrink-0"></div>
                    <span className="font-mono text-[11px] font-semibold">
                      {activeTool?.message || 'Resume2Hire agent planning next action...'}
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Form Bar */}
              <form
                onSubmit={handleSubmit}
                className="p-3 bg-surface-container-low border-t border-surface-container-high flex items-center gap-2 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask agent: 'Analyze resume', 'Find jobs', 'Apply'..."
                  disabled={isThinking}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container-high text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isThinking}
                  aria-label="Send prompt"
                  className="w-10 h-10 rounded-xl bg-primary hover:bg-primary-container text-on-primary flex items-center justify-center transition-all disabled:opacity-40 disabled:hover:bg-primary shadow-xs shrink-0"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
