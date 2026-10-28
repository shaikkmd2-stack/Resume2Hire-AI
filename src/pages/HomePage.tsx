import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { useNotifications } from '../context/NotificationContext';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { uploadResumeFile, isUploading, uploadProgress, uploadStep, uploadError, clearUploadError } = useResume();
  const { showToast } = useNotifications();
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (isUploading) return;
    clearUploadError();
    const success = await uploadResumeFile(file);
    if (success) {
      showToast('Resume parsed and analyzed successfully!', 'success');
      navigate('/resume-analysis');
    } else {
      showToast('Resume parsing failed. Please inspect the details below.', 'error');
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative w-full pt-16 pb-24 px-4 sm:px-8 bg-gradient-to-b from-surface to-surface-container-low/50">
        {/* Ambient atmospheric gradients */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-primary/10 via-secondary/15 to-transparent blur-3xl pointer-events-none rounded-full"></div>

        <div className="max-w-[1280px] mx-auto flex flex-col items-center text-center relative z-10 gap-6">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-primary/20 text-xs font-semibold text-primary shadow-xs">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>Deterministic ATS Parser & Autonomous Talent Engine</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-on-surface tracking-tight max-w-4xl leading-[1.1]">
            Turn Your Experience into <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">High-Affinity</span> Offers.
          </h1>

          <p className="font-sans text-base sm:text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            Deterministic ATS scoring, semantic job requisition matching, and human-in-the-loop application execution for ambitious engineers and executives.
          </p>

          {/* Quick Dropzone CTA Box */}
          <div className="w-full max-w-2xl mt-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
              className={`relative p-8 rounded-2xl border-2 border-dashed transition-all bg-surface-container-lowest shadow-lg ${
                dragActive
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-surface-container-high hover:border-primary/50'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                  <div className="flex flex-col gap-1 w-full max-w-md">
                    <div className="flex justify-between text-xs font-mono font-semibold text-on-surface">
                      <span>{uploadStep}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary shadow-xs">
                    <span className="material-symbols-outlined text-[32px]">upload_file</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-on-surface">
                      Drop your resume here to analyze instantly
                    </h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Supports PDF & DOCX up to 10 MB. 100% private, zero-leak processing.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all shadow-md">
                      Browse Files
                      <input
                        type="file"
                        accept=".pdf,.docx,.doc,.txt"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    <Link
                      to="/dashboard"
                      className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-all"
                    >
                      Explore Interactive Demo
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="mt-3 p-3.5 rounded-xl bg-error/10 border border-error/25 flex items-start justify-between gap-3 text-xs text-error text-left">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                  <span>{uploadError}</span>
                </div>
                <button onClick={clearUploadError} className="text-error/70 hover:text-error shrink-0">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-6 mt-3 text-xs text-outline font-mono">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
                Deterministic ATS Check
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
                Zero-Blind Dispatch Guarantee
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-emerald-600">check_circle</span>
                No Credit Card Required
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Integration Bar */}
      <section className="w-full bg-surface-container-low/60 border-y border-surface-container-high py-8 px-4">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-xs font-mono uppercase tracking-wider font-semibold text-on-surface-variant">
            Continuously Synchronized With Enterprise ATS Platforms:
          </span>
          <div className="flex flex-wrap items-center gap-8 text-on-surface-variant font-display font-bold text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Greenhouse
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Lever
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Ashby
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Workday
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Taleo
            </span>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="w-full py-20 px-4 sm:px-8 bg-surface-container-lowest">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-12">
          <div className="flex flex-col gap-2 max-w-2xl">
            <span className="font-mono text-xs uppercase font-semibold text-primary tracking-wider">
              System Architecture
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Engineered for signal, precision, and executive confidence.
            </h2>
            <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
              Every component is built to replace noise with verified metrics and high-probability interview conversions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-container-high/70 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-4">
                  <span className="material-symbols-outlined text-[26px]">task_alt</span>
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface mb-2">
                  Deterministic ATS Parsing
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Extracts raw text, font hierarchies, tabular sections, and skills without hallucination. Generates an instant pass probability score against top enterprise applicant tracking systems.
                </p>
              </div>
              <Link to="/resume-analysis" className="text-xs font-semibold text-primary hover:underline mt-6 flex items-center gap-1">
                View Analysis Engine →
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-container-high/70 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed mb-4">
                  <span className="material-symbols-outlined text-[26px]">difference</span>
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface mb-2">
                  AI Bullet Diff Engine
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Side-by-side git-style diffs highlighting quantitative enhancements, action verb upgrades, and keyword alignment. Suggestions are never applied without your explicit approval.
                </p>
              </div>
              <Link to="/ai-resume-improvement" className="text-xs font-semibold text-primary hover:underline mt-6 flex items-center gap-1">
                Inspect Diff Engine →
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-container-high/70 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-tertiary mb-4">
                  <span className="material-symbols-outlined text-[26px]">hub</span>
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface mb-2">
                  Semantic Role Affinity
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Evaluates target roles using high-dimensional cosine similarity. Automatically identifies matched core competencies and actionable skill gaps before you apply.
                </p>
              </div>
              <Link to="/jobs" className="text-xs font-semibold text-primary hover:underline mt-6 flex items-center gap-1">
                Explore Job Matches →
              </Link>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-container-high/70 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary mb-4">
                  <span className="material-symbols-outlined text-[26px]">verified_user</span>
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface mb-2">
                  Human Approval Gate
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Zero-blind-dispatch policy. Our autonomous background agents search and pre-compile application packets, but will never transmit data without your cryptographic sign-off.
                </p>
              </div>
              <Link to="/agent-activity" className="text-xs font-semibold text-primary hover:underline mt-6 flex items-center gap-1">
                Review Gate Protocol →
              </Link>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-container-high/70 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 mb-4">
                  <span className="material-symbols-outlined text-[26px]">view_kanban</span>
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface mb-2">
                  Lifecycle Application Tracker
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Real-time synchronization across submissions, interview scheduling, offer letters, and compensation metrics with filterable states and timeline history.
                </p>
              </div>
              <Link to="/applications" className="text-xs font-semibold text-primary hover:underline mt-6 flex items-center gap-1">
                View Tracker Pipeline →
              </Link>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-surface border border-surface-container-high/70 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 mb-4">
                  <span className="material-symbols-outlined text-[26px]">speed</span>
                </div>
                <h3 className="font-display text-lg font-bold text-on-surface mb-2">
                  Executive Telemetry
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Comprehensive dashboard reporting overall resume health, ATS pass probability, compensation bands, and autonomous background daemon telemetry.
                </p>
              </div>
              <Link to="/dashboard" className="text-xs font-semibold text-primary hover:underline mt-6 flex items-center gap-1">
                Open Executive Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full py-20 px-4 sm:px-8 bg-surface-container-low/40">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
            <span className="font-mono text-xs uppercase font-semibold text-primary tracking-wider">
              Operational Workflow
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Four steps from parsing to offer stage.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col gap-3">
              <span className="font-mono text-2xl font-bold text-primary">01</span>
              <h4 className="font-display text-base font-bold text-on-surface">Upload & Parse</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Upload your PDF/DOCX. Our deterministic engine extracts 100% of skills and structure with zero data leaks.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col gap-3">
              <span className="font-mono text-2xl font-bold text-secondary">02</span>
              <h4 className="font-display text-base font-bold text-on-surface">Tailor with Diff</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Review targeted metric enhancements and action verbs. Accept, reject, or edit suggestions with full control.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col gap-3">
              <span className="font-mono text-2xl font-bold text-tertiary">03</span>
              <h4 className="font-display text-base font-bold text-on-surface">Continuous Matching</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Background daemon scans verified ATS requisitions (Greenhouse, Lever, Ashby) to find 90%+ affinity roles.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col gap-3">
              <span className="font-mono text-2xl font-bold text-emerald-600">04</span>
              <h4 className="font-display text-base font-bold text-on-surface">Approve & Track</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Authorize submissions at the Human Approval Gate, then follow real-time interview progressions in your ledger.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Guarantee CTA Banner */}
      <section id="security" className="w-full py-16 px-4 sm:px-8 bg-gradient-to-r from-navy-950 via-[#131b2e] to-[#283044] text-white">
        <div className="max-w-[1280px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-mono text-indigo-300 w-fit">
              <span className="material-symbols-outlined text-[16px]">lock</span>
              SOC2 Type II + Zero-Surprise Policy
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
              Your career data is strictly yours. No blind applications.
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Unlike generic auto-apply bots that spam recruiters with unvetted resumes, Resume2Hire AI enforces strict human verification. We never apply anywhere without your explicit click.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <Link
              to="/signup"
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-white font-semibold text-sm shadow-lg transition-all"
            >
              Create Free Account
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all"
            >
              Launch Live App →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
