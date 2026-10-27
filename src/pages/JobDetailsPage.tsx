import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { JobItem } from '../types';
import { jobService } from '../services/jobService';
import { applicationService } from '../services/applicationService';
import { useNotifications } from '../context/NotificationContext';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const JobDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [job, setJob] = useState<JobItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      jobService.getJobById(id).then((data) => {
        setJob(data);
        setLoading(false);
      });
    }
  }, [id]);

  const handleApplyConfirm = async () => {
    if (!job) return;
    setIsApplying(true);
    try {
      await applicationService.createApplication({
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        salary: job.salaryRange,
        sourceATS: job.sourceATS,
        status: 'submitted',
        matchScore: job.matchScore,
        nextStep: 'ATS Parsing & Recruiter Routing',
        agentExecuted: true,
        notes: 'Submitted via Executive Precision console with candidate sign-off.',
      });
      showToast(`Application packet created for ${job.company}!`, 'success');
      setConfirmModalOpen(false);
      navigate('/applications');
    } catch {
      showToast('Failed to record application.', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <span className="text-xs font-mono text-on-surface-variant">Loading requisition specification...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h2 className="font-display text-xl font-bold text-on-surface">Requisition Not Found</h2>
        <p className="text-xs text-on-surface-variant mt-2 mb-6">
          The requested job posting may have been archived or filled.
        </p>
        <Link to="/jobs" className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-semibold">
          Return to Recommendations
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link to="/jobs" className="hover:text-on-surface flex items-center gap-1 font-medium">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Recommendations
        </Link>
        <span>/</span>
        <span className="font-bold text-on-surface truncate">{job.company} — {job.title}</span>
      </div>

      {/* Hero Header Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-surface-container-high flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-display text-2xl font-black shadow-md shrink-0">
            {job.company.substring(0, 2).toUpperCase()}
          </div>

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-primary font-mono">{job.company}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-mono text-xs font-bold">
                {job.matchScore}% Match
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-[10px]">
                {job.sourceATS} API
              </span>
              <span className="text-xs text-outline font-mono">• Posted {job.postedAgo}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant mt-2">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                {job.location} ({job.workMode})
              </span>
              <span>•</span>
              <span className="font-mono text-primary font-bold">{job.salaryRange}</span>
              <span>•</span>
              <span className="text-on-surface">{job.department}</span>
            </div>
          </div>
        </div>

        {/* CTA Button Group */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/ai-resume-improvement"
            className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs border border-surface-container-high flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">difference</span>
            Tailor Bullets for this Role
          </Link>

          <button
            type="button"
            onClick={() => setConfirmModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs shadow-md flex items-center gap-2 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            Prepare Application Packet
          </button>
        </div>
      </div>

      {/* Semantic Match Explanation Box */}
      <div className="p-6 rounded-2xl bg-surface-container-low/70 border border-surface-container-high flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            <span>Semantic Vector Affinity Explanation</span>
          </div>
          <span className="font-mono text-xs font-bold text-primary">{job.matchScore}% Algorithmic Overlap</span>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Based on your parsed resume (<strong className="text-on-surface">Staff_Engineer_Resume_v4.pdf</strong>), your experience in large-scale Kubernetes orchestration and low-latency Golang services aligns directly with the core requirements of this requisition.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high">
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              High-Confidence Matched Competencies ({job.matchedSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {job.matchedSkills.map((sk) => (
                <span key={sk} className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {sk}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high">
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-[16px]">info</span>
              Target Improvement Recommendations ({job.missingSkills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {job.missingSkills.map((sk) => (
                <span key={sk} className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  {sk}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Spec Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Job Body */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-xs border border-surface-container-high flex flex-col gap-6">
            <div>
              <h2 className="font-display text-lg font-bold text-on-surface mb-3">Role Overview</h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">{job.description}</p>
            </div>

            <div className="border-t border-surface-container pt-6">
              <h3 className="font-display text-base font-bold text-on-surface mb-3">Key Responsibilities</h3>
              <ul className="space-y-2.5">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="text-xs text-on-surface-variant flex items-start gap-2.5 leading-relaxed">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                      check
                    </span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-surface-container pt-6">
              <h3 className="font-display text-base font-bold text-on-surface mb-3">Core Requirements</h3>
              <ul className="space-y-2.5">
                {job.requirements.map((req, i) => (
                  <li key={i} className="text-xs text-on-surface-variant flex items-start gap-2.5 leading-relaxed">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">
                      arrow_right
                    </span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {job.niceToHaves.length > 0 && (
              <div className="border-t border-surface-container pt-6">
                <h3 className="font-display text-base font-bold text-on-surface mb-3">Nice to Have</h3>
                <ul className="space-y-2.5">
                  {job.niceToHaves.map((nth, i) => (
                    <li key={i} className="text-xs text-on-surface-variant flex items-start gap-2.5 leading-relaxed">
                      <span className="material-symbols-outlined text-[16px] text-outline shrink-0 mt-0.5">
                        add
                      </span>
                      <span>{nth}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info: Benefits & External link */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-high flex flex-col gap-4">
            <h3 className="font-display text-base font-bold text-on-surface">Compensation & Perks</h3>
            <div className="p-3 rounded-xl bg-surface-container-low font-mono text-xs font-bold text-primary">
              {job.salaryRange}
            </div>
            <ul className="space-y-2">
              {job.benefits.map((b, i) => (
                <li key={i} className="text-xs text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">done</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-high flex flex-col gap-3">
            <h3 className="font-display text-base font-bold text-on-surface">Source Requisition</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Discovered automatically via {job.sourceATS} public webhook ingestion.
            </p>
            {job.externalUrl && (
              <a
                href={job.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
              >
                <span>View Raw Job Requisition</span>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmModalOpen}
        title="Sign Off on Application Packet"
        message={`Authorize Resume2Hire AI to prepare and schedule your verified application packet for ${job.title} at ${job.company}? Zero blind dispatch policy guarantees your explicit consent.`}
        confirmLabel={isApplying ? 'Creating Packet...' : 'Confirm & Schedule'}
        variant="primary"
        onConfirm={handleApplyConfirm}
        onCancel={() => setConfirmModalOpen(false)}
      />
    </div>
  );
};
