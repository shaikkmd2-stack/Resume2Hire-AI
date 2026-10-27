import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ResumeProvider } from './context/ResumeContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import { AppLayout } from './components/layout/AppLayout';
import { PublicLayout } from './components/layout/PublicLayout';

// Public Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Authenticated Pages
import { DashboardPage } from './pages/DashboardPage';
import { ResumeAnalysisPage } from './pages/ResumeAnalysisPage';
import { JobRecommendationsPage } from './pages/JobRecommendationsPage';
import { JobDetailsPage } from './pages/JobDetailsPage';
import { AiResumeImprovementPage } from './pages/AiResumeImprovementPage';
import { ApplicationTrackerPage } from './pages/ApplicationTrackerPage';
import { AiAgentActivityPage } from './pages/AiAgentActivityPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';

const NotFoundPage: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 gap-4">
    <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary text-2xl font-mono font-bold">
      404
    </div>
    <h1 className="font-display text-2xl font-bold text-on-surface">Page Not Found</h1>
    <p className="text-xs text-on-surface-variant max-w-sm">
      The requested route does not exist in the Resume2Hire AI matrix.
    </p>
    <Link
      to="/dashboard"
      className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm"
    >
      Return to Dashboard
    </Link>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ResumeProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Marketing & Auth Layout */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>

              {/* Authenticated Dashboard & Tooling Layout */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/resume-analysis" element={<ResumeAnalysisPage />} />
                <Route path="/jobs" element={<JobRecommendationsPage />} />
                <Route path="/jobs/:id" element={<JobDetailsPage />} />
                <Route path="/ai-resume-improvement" element={<AiResumeImprovementPage />} />
                <Route path="/applications" element={<ApplicationTrackerPage />} />
                <Route path="/agent-activity" element={<AiAgentActivityPage />} />
                <Route path="/profile" element={<ProfileSettingsPage />} />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </NotificationProvider>
        </ResumeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
