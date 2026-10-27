import React from 'react';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onToggleCollapse }) => {
  const primaryNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Resume Analysis', path: '/resume-analysis', icon: 'picture_as_pdf', badge: '92%' },
    { name: 'Job Recommendations', path: '/jobs', icon: 'work', badge: '4 New' },
    { name: 'AI Resume Improvement', path: '/ai-resume-improvement', icon: 'difference' },
    { name: 'Application Tracker', path: '/applications', icon: 'view_kanban', badge: '4' },
    { name: 'AI Agent Activity', path: '/agent-activity', icon: 'smart_toy', badge: '2 Gate' },
    { name: 'Profile & Settings', path: '/profile', icon: 'settings' },
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col bg-surface-container-lowest border-r border-surface-container-high/70 transition-all duration-200 shrink-0 sticky top-16 h-[calc(100vh-4rem)] z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Sidebar Header / Status */}
      <div className="p-4 border-b border-surface-container flex items-center justify-between">
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-primary flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              DAEMON ACTIVE v4.19
            </span>
            <span className="text-xs font-semibold text-on-surface truncate">Alex Chen · Staff L6+</span>
          </div>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Toggle sidebar"
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors mx-auto"
          >
            <span className="material-symbols-outlined text-[20px]">
              {collapsed ? 'menu_open' : 'keyboard_double_arrow_left'}
            </span>
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {primaryNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm shadow-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 ${
                    isActive ? 'text-on-primary' : 'text-on-surface-variant group-hover:text-primary'
                  }`}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1.5 shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : item.badge.includes('Gate')
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-surface-container-high text-primary'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Zero Trust Footer Banner */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-xl bg-surface-container-low/70 border border-surface-container-high text-on-surface-variant text-[11px] flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>Zero-Surprise Guard</span>
          </div>
          <p className="text-[10px] leading-tight text-outline">
            No external dispatch occurs without candidate cryptographic approval.
          </p>
        </div>
      )}
    </aside>
  );
};
