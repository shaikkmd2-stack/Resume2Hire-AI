import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useResume } from '../context/ResumeContext';
import { ScoreGauge } from '../components/common/ScoreGauge';
import { Badge } from '../components/common/Badge';
import { jobService } from '../services/jobService';
import { applicationService } from '../services/applicationService';
import { agentService } from '../services/agentService';
import { JobItem, JobApplication, AgentActivityItem } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { resume } = useResume();

  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [agentActivities, setAgentActivities] = useState<AgentActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        const [jobsData, appsData, actsData] = await Promise.all([
          jobService.getJobs(),
          applicationService.getApplications(),
          agentService.getActivities(),
        ]);
        if (isMounted) {
          setJobs(jobsData);
          setApplications(appsData);
          setAgentActivities(actsData);
        }
      } catch (err) {
        console.warn('[DashboardPage] Error loading dashboard datasets:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const topJobs = jobs.slice(0, 3);
  const pendingApprovals = agentActivities.filter((a) => a.requiresApproval && a.status === 'pending');
  const topMatch = jobs.length > 0 ? jobs[0] : null;

  const underReviewCount = applications.filter((a) => a.status === 'under_review').length;
  const interviewingCount = applications.filter((a) => a.status === 'interviewing').length;
  const offerCount = applications.filter((a) => a.status === 'offer').length;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Welcome & Command Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-high p-6 sm:p-8 shadow-xs border border-surface-container-high/80">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-surface-container-lowest text-primary font-semibold border border-primary/20 shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                ACTIVE TALENT INTELLIGENCE
              </span>
              <span className="text-xs text-on-surface-variant font-medium">
                Live Cloud Sync Active
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
              Welcome back, {user?.name || 'Executive Candidate'}
            </h1>
            <p className="font-body-md text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Your profile is operating at <strong className="text-on-surface font-semibold">{resume.overallScore}% ATS readiness</strong> for {resume.targetRole || 'Software Engineering'} roles. {pendingApprovals.length} applications require candidate approval.
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/resume-analysis"
              className="px-4 py-2.5 rounded-xl bg-surface-container-lowest hover:bg-white text-on-surface text-xs font-semibold shadow-xs border border-surface-container-high transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">upload_file</span>
              Upload & Analyze Resume
            </Link>
            <Link
              to="/agent-activity"
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              Human Approval Gate ({pendingApprovals.length})
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Resume Score Card & Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Score Overview Bento */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-high flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-outline font-semibold">
                Executive Health Index
              </span>
              <h2 className="font-display text-lg font-bold text-on-surface">Overall Resume Score</h2>
            </div>
            <Badge variant="primary" size="sm">
              {resume.overallScore >= 80 ? 'Competitive Tier' : 'Analysis Ready'}
            </Badge>
          </div>

          <div className="my-6 flex items-center gap-6">
            <ScoreGauge score={resume.overallScore} size={110} strokeWidth={9} label="Index" />
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                {resume.filename ? resume.filename : 'Active Profile Vector'}
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Deterministic ATS checks show verified skill matches across {resume.skills.length} extracted competencies.
              </p>
              <span className="font-mono text-[11px] text-emerald-700 font-semibold mt-1">
                {resume.atsProbability}% ATS Compatibility Probability
              </span>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-surface-container">
            <div className="flex flex-col bg-surface-container-low p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-on-surface-variant font-medium">Impact</span>
              <span className="font-mono text-sm font-bold text-primary">{resume.breakdown.impact}%</span>
            </div>
            <div className="flex flex-col bg-surface-container-low p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-on-surface-variant font-medium">Brevity</span>
              <span className="font-mono text-sm font-bold text-primary">{resume.breakdown.brevity}%</span>
            </div>
            <div className="flex flex-col bg-surface-container-low p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-on-surface-variant font-medium">Style</span>
              <span className="font-mono text-sm font-bold text-primary">{resume.breakdown.style}%</span>
            </div>
            <div className="flex flex-col bg-surface-container-low p-2.5 rounded-xl text-center">
              <span className="text-[10px] text-on-surface-variant font-medium">Coverage</span>
              <span className="font-mono text-sm font-bold text-primary">{resume.breakdown.skillsCoverage}%</span>
            </div>
          </div>
        </div>

        {/* Pipeline & Application Stats */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Active Pipeline</span>
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">view_kanban</span>
              </span>
            </div>
            <div className="my-3">
              <span className="font-display text-3xl font-extrabold text-on-surface">
                {applications.length}
              </span>
              <span className="text-xs text-on-surface-variant ml-2">Total Submissions</span>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant border-t border-surface-container pt-3">
              <span>{underReviewCount} Under Review</span>
              <span className="text-primary font-semibold">{interviewingCount} Interview Round</span>
              <span className="text-emerald-700 font-semibold">{offerCount} Offer Stage</span>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Peak Role Affinity</span>
              <span className="w-8 h-8 rounded-lg bg-purple-50 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">verified</span>
              </span>
            </div>
            <div className="my-3">
              <span className="font-display text-3xl font-extrabold text-primary">
                {topMatch ? `${topMatch.matchScore}%` : '85%'}
              </span>
              <span className="text-xs text-on-surface-variant ml-2 truncate">
                {topMatch ? `${topMatch.company} - ${topMatch.title}` : 'Role Affinity Calculated'}
              </span>
            </div>
            <Link
              to="/jobs"
              className="text-xs font-semibold text-primary hover:underline flex items-center justify-between border-t border-surface-container pt-3"
            >
              <span>Explore {jobs.length} Available Roles</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Extracted Core Skills</span>
              <span className="w-8 h-8 rounded-lg bg-teal-50 text-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">terminal</span>
              </span>
            </div>
            <div className="my-2 flex flex-wrap gap-1.5">
              {resume.skills.length > 0 ? (
                <>
                  {resume.skills.slice(0, 5).map((s) => (
                    <span
                      key={s.name}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface font-semibold"
                    >
                      {s.name}
                    </span>
                  ))}
                  {resume.skills.length > 5 && (
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-outline">
                      +{resume.skills.length - 5} more
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-on-surface-variant italic">Upload resume to extract skills</span>
              )}
            </div>
            <Link
              to="/resume-analysis"
              className="text-xs font-semibold text-primary hover:underline border-t border-surface-container pt-2"
            >
              View Full Competency Map →
            </Link>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Resume Improvement</span>
              <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">difference</span>
              </span>
            </div>
            <div className="my-3">
              <span className="font-display text-3xl font-extrabold text-amber-600">
                {resume.actionableSuggestions.length > 0 ? `+${(resume.actionableSuggestions.length * 2.5).toFixed(1)}%` : '+5.0%'}
              </span>
              <span className="text-xs text-on-surface-variant ml-2">Potential Gain Available</span>
            </div>
            <Link
              to="/ai-resume-improvement"
              className="text-xs font-semibold text-primary hover:underline flex items-center justify-between border-t border-surface-container pt-3"
            >
              <span>Review {resume.actionableSuggestions.length || 3} Suggestions</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended Jobs & Applications Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Top Matches Column */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-on-surface">Top Recommended Roles</h2>
              <Badge variant="primary" size="sm">
                {jobs.length} Verified
              </Badge>
            </div>
            <Link to="/jobs" className="text-xs font-semibold text-primary hover:underline">
              View All Jobs ({jobs.length}) →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-surface-container text-xs text-on-surface-variant">
              Loading verified job listings and computing personalized match vectors...
            </div>
          ) : topJobs.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-surface-container text-xs text-on-surface-variant">
              No matching jobs found at this time. Check back soon.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {topJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high hover:border-primary/40 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center font-bold text-primary shrink-0 shadow-xs">
                      {job.company.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-on-surface">{job.company}</span>
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-mono text-[11px] font-bold">
                          {job.matchScore}% Match
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-[10px]">
                          {job.sourceATS}
                        </span>
                      </div>
                      <Link
                        to={`/jobs/${job.id}`}
                        className="font-display text-sm font-bold text-on-surface hover:text-primary transition-colors mt-0.5"
                      >
                        {job.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
                        <span>{job.location}</span>
                        <span>•</span>
                        <span className="font-mono text-primary font-semibold">{job.salaryRange}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors"
                    >
                      Details
                    </Link>
                    <Link
                      to="/ai-resume-improvement"
                      className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold transition-all shadow-xs"
                    >
                      Tailor Resume
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Applications & Recent Agent Activity Column */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          {/* Applications Snippet */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-on-surface">Recent Applications</h3>
              <Link to="/applications" className="text-xs font-semibold text-primary hover:underline">
                View Tracker ({applications.length}) →
              </Link>
            </div>

            {applications.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-container-low/50 text-center text-xs text-on-surface-variant">
                No active applications tracked yet. Dispatches will appear here.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {applications.slice(0, 3).map((app) => (
                  <div
                    key={app.id}
                    className="p-3 rounded-xl bg-surface-container-low/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-on-surface truncate">{app.company}</span>
                      <span className="text-[11px] text-on-surface-variant truncate">{app.jobTitle}</span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          app.status === 'offer'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'interviewing'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {app.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-[10px] text-outline mt-0.5">{app.lastUpdated}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Autonomous Agent Ledger Snippet */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                <h3 className="font-display text-base font-bold text-on-surface">Agent Activity Ledger</h3>
              </div>
              <Link to="/agent-activity" className="text-xs font-semibold text-primary hover:underline">
                Full Ledger →
              </Link>
            </div>

            {agentActivities.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface-container-low/50 text-center text-xs text-on-surface-variant">
                No autonomous activity logged yet.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {agentActivities.slice(0, 3).map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <span
                      className={`material-symbols-outlined text-[16px] mt-0.5 ${
                        act.status === 'pending'
                          ? 'text-amber-600'
                          : act.status === 'completed'
                          ? 'text-emerald-600'
                          : 'text-primary'
                      }`}
                    >
                      {act.status === 'pending' ? 'gavel' : 'check_circle'}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-on-surface truncate">{act.actionName}</span>
                      <span className="text-[11px] text-on-surface-variant line-clamp-1">{act.details}</span>
                      <span className="text-[10px] text-outline font-mono">{act.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
