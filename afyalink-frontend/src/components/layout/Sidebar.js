import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { ROUTES } from '../../routes/routeConstants';
import { USER_ROLES } from '../../utils/constants';
import UserAvatar from '../shared/UserAvatar';
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineFolder,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineCog,
  HiOutlineShieldCheck,
  HiOutlineCalendar,
  HiOutlineMap,
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlineDatabase,
  HiX,
  HiOutlineDocumentReport,
  HiOutlineChartSquareBar,
  HiOutlineExclamation,
  HiOutlineLogout,
  HiOutlineChevronRight,
} from 'react-icons/hi';

const adminLinks = [
  { to: ROUTES.ADMIN.DASHBOARD, icon: HiOutlineViewGrid, label: 'Dashboard', badge: null },
  { to: ROUTES.ADMIN.USERS, icon: HiOutlineUsers, label: 'Users', badge: null },
  { to: ROUTES.ADMIN.BENEFICIARIES, icon: HiOutlineHeart, label: 'Beneficiaries', badge: null },
  { to: ROUTES.ADMIN.CASES, icon: HiOutlineFolder, label: 'Cases', badge: null },
  { to: ROUTES.ADMIN.INTERVENTIONS, icon: HiOutlineClipboardList, label: 'Interventions', badge: null },
  { to: ROUTES.ADMIN.ANALYTICS, icon: HiOutlineChartSquareBar, label: 'Analytics', badge: 'New' },
  { to: ROUTES.ADMIN.ALL_REPORTS, icon: HiOutlineChartBar, label: 'All Reports', badge: null },
  { to: ROUTES.ADMIN.PERFORMANCE, icon: HiOutlineExclamation, label: 'Performance', badge: null },
  { to: ROUTES.ADMIN.AUDIT_LOGS, icon: HiOutlineShieldCheck, label: 'Audit Logs', badge: null },
  // { to: ROUTES.ADMIN.SYSTEM_SETTINGS, icon: HiOutlineDatabase, label: 'System Settings', badge: null },
];

const supervisorLinks = [
  { to: ROUTES.SUPERVISOR.DASHBOARD, icon: HiOutlineViewGrid, label: 'Dashboard', badge: null },
  { to: ROUTES.SUPERVISOR.BENEFICIARIES, icon: HiOutlineHeart, label: 'Beneficiaries', badge: null },
  { to: ROUTES.SUPERVISOR.CASES, icon: HiOutlineFolder, label: 'Team Cases', badge: null },
  { to: ROUTES.SUPERVISOR.INTERVENTIONS, icon: HiOutlineClipboardList, label: 'Interventions', badge: null },
  { to: ROUTES.SUPERVISOR.CASE_MONITOR, icon: HiOutlineEye, label: 'Case Monitor', badge: null },
  { to: ROUTES.SUPERVISOR.TEAM_ANALYTICS, icon: HiOutlineChartSquareBar, label: 'Team Analytics', badge: null },
  { to: ROUTES.SUPERVISOR.TEAM_REPORTS, icon: HiOutlineDocumentReport, label: 'Team Reports', badge: null },
];

const socialWorkerLinks = [
  { to: ROUTES.SOCIAL_WORKER.DASHBOARD, icon: HiOutlineViewGrid, label: 'Dashboard', badge: null },
  { to: ROUTES.SOCIAL_WORKER.BENEFICIARIES, icon: HiOutlineHeart, label: 'Beneficiaries', badge: null },
  { to: ROUTES.SOCIAL_WORKER.MY_CASES, icon: HiOutlineFolder, label: 'My Cases', badge: null },
  { to: ROUTES.SOCIAL_WORKER.INTERVENTIONS, icon: HiOutlineClipboardList, label: 'Interventions', badge: null },
  { to: ROUTES.SOCIAL_WORKER.MY_REPORTS, icon: HiOutlineDocumentReport, label: 'My Reports', badge: null },
  { to: ROUTES.SOCIAL_WORKER.SCHEDULE, icon: HiOutlineCalendar, label: 'Schedule', badge: null },
  { to: ROUTES.SOCIAL_WORKER.FIELD_WORK, icon: HiOutlineMap, label: 'Field Work', badge: null },
];

function getLinks(role) {
  switch (role) {
    case USER_ROLES.ADMIN: return adminLinks;
    case USER_ROLES.SUPERVISOR: return supervisorLinks;
    case USER_ROLES.SOCIAL_WORKER: return socialWorkerLinks;
    default: return [];
  }
}

function getSettingsPath(role) {
  switch (role) {
    case USER_ROLES.ADMIN: return ROUTES.ADMIN.SETTINGS;
    case USER_ROLES.SUPERVISOR: return ROUTES.SUPERVISOR.SETTINGS;
    case USER_ROLES.SOCIAL_WORKER: return ROUTES.SOCIAL_WORKER.SETTINGS;
    default: return ROUTES.SHARED.SETTINGS;
  }
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const location = useLocation();
  const links = getLinks(user?.role);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Brand Header */}
      <div className={`relative border-b border-gray-100 dark:border-gray-700 ${collapsed ? 'px-4 py-6' : 'px-6 py-6'}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 bg-gradient-to-br from-primary via-primary-600 to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-primary/10">
              <HiOutlineHeart className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black bg-gradient-to-r from-primary via-primary-600 to-secondary bg-clip-text text-transparent leading-tight">
                AfyaLink
              </h1>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold tracking-wide">Case Management</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent rounded-full" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto custom-scrollbar">
        {!collapsed && (
          <div className="px-3 mb-4">
            <p className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em]">Main Menu</p>
          </div>
        )}
        
        {links.map((link) => {
          const isActive = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMobile}
              title={collapsed ? link.label : undefined}
              className={`
                group relative flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-200
                ${collapsed ? 'px-0 py-3 justify-center' : 'px-4 py-3'}
                ${isActive
                  ? 'bg-gradient-to-r from-primary to-primary-600 text-white shadow-lg shadow-primary/30'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary'
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && !collapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg" />
              )}
              
              {/* Icon */}
              <div className={`relative flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110'} transition-transform duration-200`}>
                <link.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-primary'}`} />
                {isActive && !collapsed && (
                  <div className="absolute -inset-2 bg-white/20 rounded-lg blur-sm -z-10" />
                )}
              </div>
              
              {/* Label */}
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{link.label}</span>
                  
                  {/* Badge */}
                  {link.badge && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {link.badge}
                    </span>
                  )}
                  
                  {/* Arrow indicator */}
                  {isActive && (
                    <HiOutlineChevronRight className="w-4 h-4 text-white/80 animate-pulse" />
                  )}
                </>
              )}

              {/* Collapsed active dot */}
              {isActive && collapsed && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-gray-100 dark:border-gray-700">
        <NavLink
          to={getSettingsPath(user?.role)}
          onClick={closeMobile}
          title={collapsed ? 'Settings' : undefined}
          className={`
            flex items-center gap-3 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-all duration-200
            ${collapsed ? 'px-0 py-3 justify-center' : 'px-6 py-3.5'}
          `}
        >
          <HiOutlineCog className="w-5 h-5" />
          {!collapsed && <span>Settings</span>}
        </NavLink>

        {/* User Profile Card */}
        {!collapsed && (
          <div className="p-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="relative flex-shrink-0">
                <UserAvatar user={user} size="md" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white dark:border-gray-800 rounded-full ring-2 ring-emerald-100" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user?.fullName}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-medium capitalize">
                  {user?.role?.replace('_', ' ')?.toLowerCase()}
                </p>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all duration-200 group"
              >
                <HiOutlineLogout className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Collapsed user indicator */}
        {collapsed && (
          <div className="p-4 flex justify-center">
            <button
              onClick={logout}
              title="Sign Out"
              className="relative p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all duration-200"
            >
              <div className="relative">
                <UserAvatar user={user} size="sm" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-40 lg:hidden transition-all duration-300" 
          onClick={closeMobile} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 ease-in-out
          lg:sticky lg:z-30
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-20' : 'w-72'}
        `}
      >
        {/* Mobile close button */}
        <button
          onClick={closeMobile}
          className="absolute top-5 right-5 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 lg:hidden transition-all duration-200 z-10 shadow-sm"
        >
          <HiX className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        
        {sidebarContent}
      </aside>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </>
  );
}