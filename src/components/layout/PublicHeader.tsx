import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const PublicHeader: React.FC = () => {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-high/60 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="h-16 max-w-[1440px] mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/home" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          </div>
          <span className="font-display text-lg font-bold text-on-surface tracking-tight">
            Resume2Hire <span className="text-primary font-bold">AI</span>
          </span>
        </Link>

        {/* Public Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
            Platform Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
            How It Works
          </a>
          <a href="#security" className="text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors">
            Security & Zero-Surprise
          </a>
          <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">
            Live Demo App
          </Link>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
              location.pathname === '/login'
                ? 'text-primary bg-surface-container-high'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
            }`}
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary hover:bg-primary-container text-on-primary shadow-sm transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </header>
  );
};
