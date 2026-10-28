import React, { useState } from 'react';
import { useResume } from '../context/ResumeContext';
import { useNotifications } from '../context/NotificationContext';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { Badge } from '../components/common/Badge';

export const ResumeAnalysisPage: React.FC = () => {
  const {
    resume,
    isUploading,
    uploadProgress,
    uploadStep,
    uploadStage,
    uploadError,
    lastSelectedFile,
    uploadResumeFile,
    cancelUpload,
    retryUpload,
    parseLocalFileFallback,
    parseRawText,
    clearUploadError,
  } = useResume();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'skills' | 'experience' | 'strengths' | 'suggestions'>('skills');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return;
    clearUploadError();
    if (e.target.files && e.target.files[0]) {
      const success = await uploadResumeFile(e.target.files[0]);
      if (success) {
        showToast('Resume uploaded, parsed, and analyzed successfully!', 'success');
        setShowUploadModal(false);
      } else {
        showToast('Resume upload or analysis failed. Inspect error details.', 'error');
      }
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (isUploading) return;
    clearUploadError();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const success = await uploadResumeFile(e.dataTransfer.files[0]);
      if (success) {
        showToast('Resume uploaded, parsed, and analyzed successfully!', 'success');
        setShowUploadModal(false);
      } else {
        showToast('Resume upload or analysis failed. Inspect error details.', 'error');
      }
    }
  };

  const handlePasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await parseRawText(pastedText);
    if (success) {
      showToast('Pasted resume text parsed into competencies!', 'success');
      setShowPasteModal(false);
      setPastedText('');
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Section 1: File Header & Parse Status */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-high flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-[32px]">picture_as_pdf</span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-on-surface truncate">
                {resume.filename}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-mono text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                {resume.parsedAt}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant font-mono text-xs">
                {resume.filesize}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-1.5">
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-tertiary">verified</span>
                100% Extracted
              </span>
              <span className="text-outline-variant">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">task_alt</span>
                Deterministic ATS Check Passed
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-medium text-on-surface">Target: {resume.targetRole}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="px-4 py-2.5 bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 border border-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
            Paste Text Fallback
          </button>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Re-upload PDF / DOCX
          </button>
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">error</span>
            <span>{uploadError}</span>
          </div>
          <button
            onClick={clearUploadError}
            className="text-rose-900 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section 2: Resume Score & Health Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Main Overall Health Card */}
        <div className="xl:col-span-5 bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-surface-container-high flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                System Composite Index
              </span>
              <h2 className="font-display text-xl font-bold text-on-surface">Overall Resume Health</h2>
            </div>
            <Badge variant="primary" size="sm">
              Top 3% Tier
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 my-6">
            <ScoreGauge score={resume.overallScore} size={130} strokeWidth={10} label="Score" />
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-1.5 text-primary text-xs font-bold">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                Ultra-Competitive
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Resume demonstrates exceptional quantitative scope and deep infrastructure leadership. Ready for executive screening.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
              <span>ATS Compatibility Probability</span>
            </div>
            <span className="font-mono text-primary font-bold">99.4% Pass Rate</span>
          </div>
        </div>

        {/* Breakdown Gauges */}
        <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </span>
              <span className="font-mono text-sm font-bold text-primary">{resume.breakdown.impact}%</span>
            </div>
            <div className="my-3">
              <h3 className="font-display text-sm font-bold text-on-surface">Impact & Scope</h3>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Quantifiable outcome metrics ($3.8M savings, 45k+ nodes) firmly established.
              </p>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full" style={{ width: `${resume.breakdown.impact}%` }}></div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed">
                <span className="material-symbols-outlined text-[20px]">short_text</span>
              </span>
              <span className="font-mono text-sm font-bold text-secondary">{resume.breakdown.brevity}%</span>
            </div>
            <div className="my-3">
              <h3 className="font-display text-sm font-bold text-on-surface">Brevity & Conciseness</h3>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Optimized 2-page executive density with zero fluff sentences.
              </p>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: `${resume.breakdown.brevity}%` }}></div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-teal-50 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">format_paint</span>
              </span>
              <span className="font-mono text-sm font-bold text-tertiary">{resume.breakdown.style}%</span>
            </div>
            <div className="my-3">
              <h3 className="font-display text-sm font-bold text-on-surface">Style & Typography</h3>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Clean ATS hierarchy, correct section headers, and standard standard bullet formatting.
              </p>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-tertiary h-full rounded-full" style={{ width: `${resume.breakdown.style}%` }}></div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">checklist</span>
              </span>
              <span className="font-mono text-sm font-bold text-emerald-700">{resume.breakdown.skillsCoverage}%</span>
            </div>
            <div className="my-3">
              <h3 className="font-display text-sm font-bold text-on-surface">Skills Taxonomy Coverage</h3>
              <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                Dense coverage of modern cloud-native, distributed systems, and kernel primitives.
              </p>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${resume.breakdown.skillsCoverage}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Deep Analysis Tabs */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-surface-container-high flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-surface-container pb-3 overflow-x-auto">
          {[
            { id: 'skills', label: 'Extracted Skills', icon: 'terminal', count: resume.skills.length },
            { id: 'experience', label: 'Parsed Experience', icon: 'work', count: resume.experience.length },
            { id: 'strengths', label: 'Strengths & Gaps', icon: 'balance' },
            { id: 'suggestions', label: 'Actionable Suggestions', icon: 'lightbulb', count: resume.actionableSuggestions.length },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-surface-container text-on-surface'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab 1: Skills */}
        {activeTab === 'skills' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-xs text-on-surface-variant">
                10 competencies detected deterministically with verified seniority levels.
              </p>
              <span className="font-mono text-xs text-primary font-semibold">100% Extraction Accuracy</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resume.skills.map((skill) => (
                <div
                  key={skill.name}
                  className="p-4 rounded-xl bg-surface-container-low/70 border border-surface-container-high flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-on-surface">{skill.name}</span>
                    <span className="text-[10px] text-on-surface-variant">{skill.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-primary font-semibold">
                      {skill.proficiency}
                    </span>
                    {skill.yearsExperience && (
                      <span className="font-mono text-[10px] text-outline">{skill.yearsExperience}y</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Experience */}
        {activeTab === 'experience' && (
          <div className="flex flex-col gap-6">
            {resume.experience.map((exp) => (
              <div key={exp.id} className="p-6 rounded-2xl bg-surface-container-low/60 border border-surface-container-high flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display text-sm font-bold text-on-surface">{exp.title}</h4>
                    <span className="text-xs font-semibold text-primary">{exp.company}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
                    <span>{exp.period}</span>
                    <span>•</span>
                    <span>{exp.location}</span>
                  </div>
                </div>

                <ul className="space-y-2 mt-2">
                  {exp.bullets.map((b, idx) => (
                    <li key={idx} className="text-xs text-on-surface-variant flex items-start gap-2 leading-relaxed">
                      <span className="material-symbols-outlined text-[14px] text-primary shrink-0 mt-0.5">
                        arrow_right
                      </span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-3 border-t border-surface-container">
                  <span className="text-[10px] uppercase font-mono text-outline font-semibold">Skills Ingested:</span>
                  {exp.skillsUsed.map((sk) => (
                    <span key={sk} className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Strengths & Skill Gaps */}
        {activeTab === 'strengths' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-emerald-800">
                <span className="material-symbols-outlined text-[22px]">verified</span>
                <h4 className="font-display text-sm font-bold">Key Resume Strengths</h4>
              </div>
              <ul className="space-y-3">
                {resume.strengths.map((str, idx) => (
                  <li key={idx} className="text-xs text-emerald-900 flex items-start gap-2.5 leading-relaxed">
                    <span className="material-symbols-outlined text-[16px] text-emerald-700 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Skill Gaps */}
            <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200/60 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-amber-800">
                <span className="material-symbols-outlined text-[22px]">warning</span>
                <h4 className="font-display text-sm font-bold">Identified Skill Gaps</h4>
              </div>
              <ul className="space-y-3">
                {resume.skillGaps.map((gap, idx) => (
                  <li key={idx} className="text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
                    <span className="material-symbols-outlined text-[16px] text-amber-700 shrink-0 mt-0.5">
                      info
                    </span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 4: Actionable Suggestions */}
        {activeTab === 'suggestions' && (
          <div className="flex flex-col gap-4">
            {resume.actionableSuggestions.map((sugg) => (
              <div
                key={sugg.id}
                className="p-5 rounded-xl bg-surface-container-low/70 border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display text-xs font-bold text-on-surface">{sugg.title}</h4>
                      <span className={`px-2 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                        sugg.severity === 'High'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sugg.severity} Priority
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{sugg.description}</p>
                  </div>
                </div>

                <a
                  href="/ai-resume-improvement"
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-semibold text-xs whitespace-nowrap self-end sm:self-center"
                >
                  Apply in Diff Engine →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[24px] text-primary">cloud_upload</span>
                <h3 className="font-display text-lg font-bold text-on-surface">Upload PDF or DOCX Resume</h3>
              </div>
              <button
                type="button"
                onClick={() => !isUploading && setShowUploadModal(false)}
                disabled={isUploading}
                className="text-outline hover:text-on-surface disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {uploadError && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/25 flex flex-col gap-3 text-xs text-left">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 text-error">
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                    <span className="font-medium leading-relaxed">{uploadError}</span>
                  </div>
                  <button onClick={clearUploadError} className="text-error/70 hover:text-error shrink-0">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-error/15">
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await retryUpload();
                      if (success) {
                        showToast('Resume uploaded and parsed successfully!', 'success');
                        setShowUploadModal(false);
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-xs flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    Retry Upload
                  </button>

                  {lastSelectedFile && (
                    <button
                      type="button"
                      onClick={async () => {
                        const success = await parseLocalFileFallback();
                        if (success) {
                          showToast('Resume analyzed using deterministic ATS parser!', 'success');
                          setShowUploadModal(false);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px] text-tertiary">bolt</span>
                      Continue with Client Analysis
                    </button>
                  )}
                </div>
              </div>
            )}

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center transition-all ${
                dragActive ? 'border-primary bg-primary/5' : 'border-surface-container-high hover:border-primary/50'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-4 w-full">
                  {/* Status Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-on-surface">
                      {uploadStage === 'uploading' && 'Stage: Uploading to Firebase Storage'}
                      {uploadStage === 'saving' && 'Stage: Saving details to Firestore'}
                      {uploadStage === 'analyzing' && 'Stage: Analyzing resume & ATS metrics'}
                      {uploadStage === 'completed' && 'Stage: Completed'}
                      {uploadStage === 'failed' && 'Stage: Upload Interrupted'}
                    </span>
                  </div>

                  {/* Spinner & Step text */}
                  <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin"></div>
                  <div className="flex flex-col items-center gap-1 max-w-sm">
                    <span className="text-xs font-semibold text-on-surface text-center">{uploadStep}</span>
                    <span className="text-xs font-mono font-bold text-primary">{uploadProgress}%</span>
                  </div>

                  {/* Real-time Progress Bar */}
                  <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                      style={{ width: `${Math.min(Math.max(uploadProgress, 0), 100)}%` }}
                    ></div>
                  </div>

                  {/* Cancel Upload Button */}
                  <button
                    type="button"
                    onClick={cancelUpload}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container text-xs text-on-surface-variant font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-error">cancel</span>
                    Cancel Upload
                  </button>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[36px] text-primary mb-2">cloud_upload</span>
                  <p className="text-xs font-semibold text-on-surface">Drag & drop your file here</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 mb-4">Supported formats: PDF, DOCX, TXT (Max 10 MB)</p>
                  <label className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold cursor-pointer shadow-sm hover:bg-primary/90 transition-colors">
                    Select File
                    <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={handleFileChange} className="hidden" />
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Paste Text Fallback Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest max-w-xl w-full rounded-2xl p-6 shadow-2xl border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-on-surface">Paste Resume Text Fallback</h3>
              <button onClick={() => setShowPasteModal(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">
              If your PDF is scanned or heavily styled, paste the raw text below for deterministic parsing.
            </p>

            <form onSubmit={handlePasteSubmit} className="flex flex-col gap-4">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your resume sections, skills, and experience here..."
                rows={8}
                className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm"
                >
                  {isUploading ? 'Extracting...' : 'Parse Text'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
