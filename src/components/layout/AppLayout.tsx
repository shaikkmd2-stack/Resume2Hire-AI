import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../common/ToastContainer';
import { FloatingCareerAgent } from '../agent/FloatingCareerAgent';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Top Header Navbar */}
      <Navbar />

      {/* Body Area with persistent Sidebar + Workspace */}
      <div className="flex-1 flex pt-16">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main className="flex-1 w-full min-w-0 bg-surface-container-lowest/60 pb-16">
          <Outlet />
        </main>
      </div>

      {/* Autonomous Floating Career Assistant */}
      <FloatingCareerAgent />

      {/* Global Interactive Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};
