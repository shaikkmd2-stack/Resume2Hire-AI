import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { ToastContainer } from '../common/ToastContainer';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed">
      <PublicHeader />
      <main className="flex-1 w-full pt-16">
        <Outlet />
      </main>
      <PublicFooter />
      <ToastContainer />
    </div>
  );
};
