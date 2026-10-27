import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { JobItem } from '../types';
import { jobService } from '../services/jobService';
import { useNotifications } from '../context/NotificationContext';
import { EmptyState } from '../components/common/EmptyState';

export const JobRecommendationsPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<'All' | 'Remote' | 'Hybrid' | 'Onsite'>('All');
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [minSalary, setMinSalary] = useState<number>(0);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const results = await jobService.getJobs({
        query,
        location,
        workMode,
        minMatchScore,
        minSalary,
      });
      setJobs(results);
    } catch {
      showToast('Error loading job recommendations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [query, location, workMode, minMatchScore, minSalary]);

  const handleToggleSave = async (jobId: string, currentState: boolean) => {
    const newState = await jobService.toggleSaveJob(jobId, currentState);
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, isSaved: newState } : j))
    );
    showToast(
      newState ? 'Job saved to your shortlist!' : 'Job removed from shortlist.',
      'info'
    );
  };

  return (
    <div className="w-full flex flex-col">
      {/* Top Atmospheric Gradient Banner */}
      <div className="relative w-full overflow-hidden bg-surface-container-low py-8 px-4 sm:px-8 border-b border-surface-container-high/60">
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-primary-fixed-dim/40 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-secondary-fixed/40 blur-3xl pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto flex flex-col gap-6 relative z-10">
          {/* Breadcrumb & Telemetry Marker */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
              <span>AI Talent Intelligence</span>
              <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
              <span className="text-primary font-semibold">Recommendation Matrix</span>
              <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
              <span className="font-mono text-[11px] text-on-surface bg-surface-container-highest px-2 py-0.5 rounded">
                v2.4-SEMANTIC
              </span>
            </div>

            <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1 rounded-full shadow-xs text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-on-surface">Auto-Sync: Ashby, Greenhouse, Lever, Workday (34s ago)</span>
            </div>
          </div>

          {/* Header & Mission Statement */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-2xl">
              <span className="font-mono text-xs uppercase tracking-wider text-primary font-bold">
                Algorithmic Match Pipeline
              </span>
              <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
                Verified Role Matches
              </h1>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Real-time candidate profile alignment scoring powered by semantic parsing and engineering taxonomy benchmarking.
              </p>
            </div>

            {/* Peak Affinity Indicator */}
            <div className="flex items-center gap-4 bg-surface-container-lowest p-3 rounded-2xl shadow-xs border border-surface-container-high shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] text-on-surface-variant font-medium uppercase">Active Profile</span>
                <span className="font-mono text-xs font-bold text-on-surface">Alex Chen · Staff L6+</span>
              </div>
              <div className="w-px h-8 bg-surface-container-high"></div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-base text-primary font-bold">96%</span>
                  <span className="text-[10px] text-on-surface-variant">Peak Affinity</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Master Control */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col gap-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              {/* Role Query Input */}
              <div className="lg:col-span-5 flex items-center bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high focus-within:border-primary transition-all">
                <span className="material-symbols-outlined text-outline text-[20px] mr-2">search</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Target role title, skills, or domain (e.g. Systems, Go, Kubernetes)..."
                  className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-outline hover:text-on-surface p-1">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>

              {/* Location Input */}
              <div className="lg:col-span-3 flex items-center bg-surface-container-low px-3 py-2.5 rounded-xl border border-surface-container-high focus-within:border-primary transition-all">
                <span className="material-symbols-outlined text-outline text-[20px] mr-2">location_on</span>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location or Remote..."
                  className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
                />
              </div>

              {/* Work Mode Switcher */}
              <div className="lg:col-span-4 flex items-center bg-surface-container-low p-1 rounded-xl border border-surface-container-high text-xs">
                {(['All', 'Remote', 'Hybrid'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setWorkMode(mode)}
                    className={`flex-1 py-1.5 text-center rounded-lg font-semibold transition-all ${
                      workMode === mode
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {mode === 'All' ? 'Any Mode' : mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider & Telemetry Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-3 border-t border-surface-container">
              {/* ATS Integrations */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-outline">Sources:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
                  Greenhouse <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
                  Lever <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
                  Ashby <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
                  Workday <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </span>
              </div>

              {/* Match Score Slider */}
              <div className="flex items-center gap-3 min-w-[260px]">
                <span className="text-xs text-on-surface-variant font-medium whitespace-nowrap">
                  Min Affinity Score:
                </span>
                <input
                  type="range"
                  min="70"
                  max="98"
                  value={minMatchScore}
                  onChange={(e) => setMinMatchScore(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-primary min-w-[36px]">
                  {minMatchScore}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Jobs Listing Section */}
      <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-on-surface">Available Opportunities</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-mono text-xs font-bold">
              {jobs.length} Matches Found
            </span>
          </div>
          <span className="text-xs text-on-surface-variant">Sorted by Semantic Match Score</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <span className="text-xs font-mono text-on-surface-variant">Calculating vector cosine distances...</span>
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            icon="search_off"
            title="No matching roles found"
            description="Try adjusting your target title, lowering the minimum match score slider, or clearing the location filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setQuery('');
              setLocation('');
              setWorkMode('All');
              setMinMatchScore(70);
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-high hover:border-primary/50 hover:shadow-lg transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group"
              >
                {/* Left: Role identity and match telemetry */}
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display text-lg font-extrabold shrink-0 shadow-sm">
                    {job.company.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-bold text-on-surface">{job.company}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-mono text-xs font-bold">
                        {job.matchScore}% Match
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-[10px]">
                        {job.sourceATS} ATS
                      </span>
                      <span className="text-[11px] text-outline font-mono">• {job.postedAgo}</span>
                    </div>

                    <Link
                      to={`/jobs/${job.id}`}
                      className="font-display text-lg font-bold text-on-surface hover:text-primary transition-colors mt-0.5"
                    >
                      {job.title}
                    </Link>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                        {job.location} ({job.workMode})
                      </span>
                      <span>•</span>
                      <span className="font-mono text-primary font-bold">{job.salaryRange}</span>
                    </div>

                    {/* Matched vs Missing skills breakdown pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <span className="text-[10px] uppercase font-mono text-emerald-700 font-bold mr-1">Matched:</span>
                      {job.matchedSkills.map((sk) => (
                        <span
                          key={sk}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                        >
                          {sk}
                        </span>
                      ))}

                      {job.missingSkills.length > 0 && (
                        <>
                          <span className="text-[10px] uppercase font-mono text-amber-700 font-bold ml-2 mr-1">Gaps:</span>
                          {job.missingSkills.map((sk) => (
                            <span
                              key={sk}
                              className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200"
                            >
                              {sk}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleSave(job.id, !!job.isSaved)}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      job.isSaved
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-surface-container-low text-on-surface-variant border-surface-container-high hover:text-on-surface'
                    }`}
                    title={job.isSaved ? 'Saved to shortlist' : 'Save Job'}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {job.isSaved ? 'bookmark' : 'bookmark_border'}
                    </span>
                  </button>

                  <Link
                    to={`/jobs/${job.id}`}
                    className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs transition-colors border border-surface-container-high"
                  >
                    View Details
                  </Link>

                  <Link
                    to="/ai-resume-improvement"
                    className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>Tailor Resume</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
