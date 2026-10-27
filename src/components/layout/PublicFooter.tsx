import React from 'react';
import { Link } from 'react-router-dom';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#0f172a] text-slate-400 py-16 px-4 sm:px-8 border-t border-slate-800">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand Col */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <span className="font-display text-xl font-bold text-white tracking-tight">
              Resume2Hire <span className="text-indigo-400">AI</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            Enterprise recruitment intelligence platform delivering deterministic ATS resume parsing,
            continuous multi-source job matching, and human-in-the-loop application execution.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300 font-mono">
              SOC2 Type II Ready
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300 font-mono">
              Zero-Blind Dispatch
            </span>
          </div>
        </div>

        {/* Links Col 1: Platform */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono uppercase font-semibold text-slate-200 tracking-wider">
            Platform
          </span>
          <Link to="/resume-analysis" className="text-sm hover:text-white transition-colors">
            Resume Analysis
          </Link>
          <Link to="/jobs" className="text-sm hover:text-white transition-colors">
            Job Recommendations
          </Link>
          <Link to="/ai-resume-improvement" className="text-sm hover:text-white transition-colors">
            AI Bullet Diff Engine
          </Link>
          <Link to="/applications" className="text-sm hover:text-white transition-colors">
            Application Tracker
          </Link>
          <Link to="/agent-activity" className="text-sm hover:text-white transition-colors">
            Autonomous Agent Ledger
          </Link>
        </div>

        {/* Links Col 2: Integrations */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono uppercase font-semibold text-slate-200 tracking-wider">
            Integrations
          </span>
          <span className="text-sm text-slate-400 flex items-center gap-1.5">
            Greenhouse Enterprise <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </span>
          <span className="text-sm text-slate-400 flex items-center gap-1.5">
            Lever Talent API <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </span>
          <span className="text-sm text-slate-400 flex items-center gap-1.5">
            Ashby Public Portals <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </span>
          <span className="text-sm text-slate-400 flex items-center gap-1.5">
            Workday Cloud Connector <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </span>
        </div>

        {/* Links Col 3: Legal & Security */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-mono uppercase font-semibold text-slate-200 tracking-wider">
            Security & Trust
          </span>
          <span className="text-sm hover:text-white transition-colors cursor-pointer">
            Zero-Surprise Guarantee
          </span>
          <span className="text-sm hover:text-white transition-colors cursor-pointer">
            Privacy Policy
          </span>
          <span className="text-sm hover:text-white transition-colors cursor-pointer">
            Data Retention & Encryption
          </span>
          <span className="text-sm hover:text-white transition-colors cursor-pointer">
            Terms of Service
          </span>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© 2026 Resume2Hire AI Inc. All rights reserved. Built with Executive Precision.</p>
        <div className="flex items-center gap-4">
          <span className="font-mono text-slate-400">v4.19-BETA (Frontend)</span>
          <span>•</span>
          <Link to="/dashboard" className="text-indigo-400 hover:underline">
            Launch Dashboard →
          </Link>
        </div>
      </div>
    </footer>
  );
};
