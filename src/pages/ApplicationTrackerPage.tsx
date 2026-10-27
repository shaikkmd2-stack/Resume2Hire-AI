import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { JobApplication } from '../types';
import { applicationService } from '../services/applicationService';
import { useNotifications } from '../context/NotificationContext';
import { EmptyState } from '../components/common/EmptyState';

export const ApplicationTrackerPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    applicationService.getApplications().then((data) => {
      setApplications(data);
      setLoading(false);
    });
  }, []);

  const filteredApps = applications.filter((app) => {
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesQuery =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  const counts = {
    all: applications.length,
    under_review: applications.filter((a) => a.status === 'under_review').length,
    interviewing: applications.filter((a) => a.status === 'interviewing').length,
    offer: applications.filter((a) => a.status === 'offer').length,
  };

  const handleStatusChange = async (id: string, newStatus: JobApplication['status']) => {
    const updated = await applicationService.updateStatus(id, newStatus);
    if (updated) {
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      showToast(`Application updated to ${newStatus.replace('_', ' ')}!`, 'success');
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-8 flex flex-col gap-8">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase font-bold text-primary">
              Candidate Pipeline
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-mono text-[11px] font-bold">
              {applications.length} Active Records
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Application Lifecycle Tracker
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl leading-relaxed">
            End-to-end audit trail of submitted ATS packets, recruiter screening schedules, and technical interview stages.
          </p>
        </div>

        <button
          type="button"
          onClick={() => showToast('Application summary exported to CSV!', 'info')}
          className="px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs border border-surface-container-high transition-colors flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Audit Report
        </button>
      </div>

      {/* Summary Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
          <span className="text-xs text-on-surface-variant font-medium">Total Active Tracked</span>
          <div className="my-2">
            <span className="font-display text-3xl font-extrabold text-on-surface">{counts.all}</span>
          </div>
          <span className="text-[11px] text-outline font-mono">100% Zero-Blind Dispatch</span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
          <span className="text-xs text-on-surface-variant font-medium">Recruiter Screening</span>
          <div className="my-2">
            <span className="font-display text-3xl font-extrabold text-indigo-600">{counts.under_review}</span>
          </div>
          <span className="text-[11px] text-indigo-700 font-mono">In Recruiter Routing</span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
          <span className="text-xs text-on-surface-variant font-medium">Technical Interviewing</span>
          <div className="my-2">
            <span className="font-display text-3xl font-extrabold text-purple-600">{counts.interviewing}</span>
          </div>
          <span className="text-[11px] text-purple-700 font-mono">Active Round 2</span>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-surface-container-high flex flex-col justify-between">
          <span className="text-xs text-on-surface-variant font-medium">Offers Extended</span>
          <div className="my-2">
            <span className="font-display text-3xl font-extrabold text-emerald-600">{counts.offer}</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-mono">Ready for Negotiation</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-surface-container-high flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Applications' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'interviewing', label: 'Interviewing' },
            { id: 'offer', label: 'Offers' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center bg-surface-container-low px-3 py-1.5 rounded-xl border border-surface-container-high focus-within:border-primary transition-all md:w-72">
          <span className="material-symbols-outlined text-outline text-[18px] mr-2">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company or role..."
            className="w-full bg-transparent text-xs text-on-surface placeholder:text-outline focus:outline-none"
          />
        </div>
      </div>

      {/* Applications Table / Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-on-surface-variant">Synchronizing application records...</span>
        </div>
      ) : filteredApps.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No applications match your filter"
          description="Clear the search query or switch status filters to view other candidate records."
          actionLabel="Clear Filters"
          onAction={() => {
            setStatusFilter('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-surface-container-high hover:border-primary/40 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center font-bold text-primary shrink-0 shadow-xs">
                  {app.company.substring(0, 2).toUpperCase()}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold text-on-surface">{app.company}</span>
                    <span
                      className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold ${
                        app.status === 'offer'
                          ? 'bg-emerald-100 text-emerald-800'
                          : app.status === 'interviewing'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="font-mono text-xs text-primary font-bold">
                      {app.matchScore}% Match
                    </span>
                    <span className="text-[11px] text-outline font-mono">
                      Via {app.sourceATS} • Applied {app.appliedDate}
                    </span>
                  </div>

                  <h3 className="font-display text-base font-bold text-on-surface mt-1">
                    {app.jobTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant mt-1">
                    <span>{app.location}</span>
                    <span>•</span>
                    <span className="font-mono text-primary font-semibold">{app.salary}</span>
                  </div>

                  {/* Next Step Banner */}
                  <div className="mt-3 p-2.5 rounded-lg bg-surface-container-low/70 border border-surface-container text-xs flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                      schedule
                    </span>
                    <span className="text-on-surface-variant">
                      <strong className="text-on-surface">Next Milestone:</strong> {app.nextStep}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Quick Dropdown */}
              <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-outline font-mono">Update Stage:</span>
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as any)}
                    className="mt-1 bg-surface-container-low text-xs font-semibold text-on-surface border border-surface-container-high rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offer">Offer Stage</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <Link
                  to={`/jobs/${app.jobId}`}
                  className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs border border-surface-container-high transition-colors"
                >
                  Job Spec
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
