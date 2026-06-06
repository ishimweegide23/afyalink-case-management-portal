// Add strict prop validation to prevent runtime errors
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useNotifications } from '../../context/NotificationContext';
import { ROUTES } from '../../routes/routeConstants';
import { USER_ROLES } from '../../utils/constants';
import { caseApi } from '../../api/caseApi';
import { interventionApi } from '../../api/interventionApi';
import { beneficiaryApi } from '../../api/beneficiaryApi';
import { userApi } from '../../api/userApi';
import UserAvatar from '../shared/UserAvatar';
import Spinner from '../common/Spinner';
import { formatRelativeTime } from '../../utils/formatDate';
import {
  HiOutlineMenu,
  HiOutlineBell,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineChevronDown,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineHome,
  HiOutlineChevronRight,
  HiOutlineFolder,
  HiOutlineClipboardList,
  HiOutlineHeart,
  HiOutlineUsers,
  HiOutlineChat,
  HiOutlineExclamation,
  HiOutlineCalendar,
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineDocumentReport,
} from 'react-icons/hi';

const BREADCRUMB_MAP = {
  dashboard: 'Dashboard',
  users: 'Users',
  cases: 'Cases',
  interventions: 'Interventions',
  beneficiaries: 'Beneficiaries',
  analytics: 'Analytics',
  reports: 'Reports',
  schedule: 'Schedule',
  settings: 'Settings',
  'field-work': 'Field Work',
  'my-reports': 'My Reports',
  'team-reports': 'Team Reports',
  'case-monitor': 'Case Monitor',
  'audit-logs': 'Audit Logs',
  'system-settings': 'System Settings',
  performance: 'Performance',
  profile: 'Profile',
  notifications: 'Notifications',
  messages: 'Messages',
};

function getRolePrefix(role) {
  if (role === USER_ROLES.ADMIN) return '/admin';
  if (role === USER_ROLES.SUPERVISOR) return '/supervisor';
  return '/social-worker';
}

function useBreadcrumb() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  return parts.map((p) =>
    BREADCRUMB_MAP[p] || (isNaN(p) ? p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ') : `#${p}`)
  );
}

const CATEGORY_META = {
  cases:         { label: 'Cases',         icon: HiOutlineFolder,        color: 'bg-blue-50 text-blue-600' },
  interventions: { label: 'Interventions', icon: HiOutlineClipboardList, color: 'bg-violet-50 text-violet-600' },
  beneficiaries: { label: 'Beneficiaries', icon: HiOutlineHeart,         color: 'bg-rose-50 text-rose-600' },
  users:         { label: 'Users',         icon: HiOutlineUsers,         color: 'bg-emerald-50 text-emerald-600' },
};

function getNotifMeta(n) {
  const t = (n.type || n.notificationType || '').toUpperCase();
  const msg = (n.message || n.title || '').toLowerCase();
  if (t.includes('MESSAGE') || t.includes('CHAT') || msg.includes('message'))
    return { icon: HiOutlineChat, bg: 'bg-blue-50', color: 'text-blue-500', ring: 'ring-blue-100' };
  if (t.includes('WARNING') || t.includes('ALERT') || msg.includes('warning') || msg.includes('formal notice'))
    return { icon: HiOutlineExclamation, bg: 'bg-amber-50', color: 'text-amber-500', ring: 'ring-amber-100' };
  if (t.includes('CASE') || msg.includes('case'))
    return { icon: HiOutlineFolder, bg: 'bg-violet-50', color: 'text-violet-500', ring: 'ring-violet-100' };
  if (t.includes('INTERVENTION') || msg.includes('intervention'))
    return { icon: HiOutlineClipboardList, bg: 'bg-emerald-50', color: 'text-emerald-500', ring: 'ring-emerald-100' };
  if (t.includes('REPORT') || msg.includes('report'))
    return { icon: HiOutlineDocumentReport, bg: 'bg-cyan-50', color: 'text-cyan-500', ring: 'ring-cyan-100' };
  if (t.includes('SCHEDULE') || t.includes('REMINDER') || msg.includes('schedule') || msg.includes('reminder'))
    return { icon: HiOutlineCalendar, bg: 'bg-orange-50', color: 'text-orange-500', ring: 'ring-orange-100' };
  if (t.includes('USER') || t.includes('ASSIGN') || msg.includes('assign'))
    return { icon: HiOutlineUsers, bg: 'bg-pink-50', color: 'text-pink-500', ring: 'ring-pink-100' };
  if (t.includes('SYSTEM') || t.includes('SECURITY'))
    return { icon: HiOutlineShieldCheck, bg: 'bg-slate-100', color: 'text-slate-500', ring: 'ring-slate-200' };
  return { icon: HiOutlineBell, bg: 'bg-primary-50', color: 'text-primary', ring: 'ring-primary-100' };
}

function getNotifLink(n, prefix) {
  const t = (n.type || n.notificationType || '').toUpperCase();
  const msg = (n.message || n.title || '').toLowerCase();
  if (n.relatedConversationId) {
    const qs = new URLSearchParams();
    qs.set('conversation', n.relatedConversationId);
    if (n.relatedMessageId) qs.set('message', String(n.relatedMessageId));
    return `${ROUTES.SHARED.MESSAGES}?${qs.toString()}`;
  }
  if (n.relatedCaseId) return `${prefix}/cases/${n.relatedCaseId}`;
  if (n.relatedInterventionId) return `${prefix}/interventions/${n.relatedInterventionId}`;
  if (n.relatedBeneficiaryId) return `${prefix}/beneficiaries/${n.relatedBeneficiaryId}`;
  if (n.relatedUserId) return `${prefix}/users/${n.relatedUserId}`;
  if (t.includes('MESSAGE') || t.includes('CHAT') || t === 'NEW_MESSAGE' || msg.includes('message')) return ROUTES.SHARED.MESSAGES;
  if (t.includes('CASE') || msg.includes('case')) return `${prefix}/cases`;
  if (t.includes('INTERVENTION') || msg.includes('intervention')) return `${prefix}/interventions`;
  if (t.includes('REPORT') || msg.includes('report')) return `${prefix}/reports`;
  if (t.includes('WARNING') || msg.includes('warning') || msg.includes('formal notice')) return ROUTES.SHARED.MESSAGES;
  return null;
}

export default function Header() {
  const { user, logout } = useAuth();
  const { openMobile, toggle } = useSidebar();
  const { unreadCount, recentNotifications, loadingRecent, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [searching, setSearching] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const searchRef = useRef(null);
  const searchContainerRef = useRef(null);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const debounceRef = useRef(null);
  const crumbs = useBreadcrumb();
  const role = user?.role;
  const prefix = getRolePrefix(role);

  useEffect(() => {
    if (showSearch && searchRef.current) searchRef.current.focus();
  }, [showSearch]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifDropdown(false);
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) closeSearch();
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeSearch = useCallback(() => {
    setQuery('');
    setResults({});
    setShowSearch(false);
    setSelectedIdx(-1);
  }, []);

  const performSearch = useCallback(async (keyword) => {
    if (!keyword || keyword.length < 1) { setResults({}); setSearching(false); return; }
    setSearching(true);
    const params = { keyword, page: 0, size: 5 };
    const promises = {};

    promises.cases = caseApi.search(params).then((r) => (r?.data?.content || []).map((c) => ({
      id: c.id, title: c.title || c.caseNumber, subtitle: `${c.status || ''} ${c.caseNumber ? '• ' + c.caseNumber : ''}`.trim(),
      path: `${prefix}/cases/${c.id}`,
    }))).catch(() => []);

    promises.interventions = interventionApi.search(params).then((r) => (r?.data?.content || []).map((i) => ({
      id: i.id, title: i.title, subtitle: `${i.type?.replace('_', ' ') || ''} • ${i.status || ''}`.trim(),
      path: `${prefix}/interventions/${i.id}`,
    }))).catch(() => []);

    promises.beneficiaries = beneficiaryApi.search(params).then((r) => (r?.data?.content || []).map((b) => ({
      id: b.id, title: `${b.firstName || ''} ${b.lastName || ''}`.trim() || 'Unnamed',
      subtitle: b.nationalId || b.phoneNumber || '',
      path: `${prefix}/beneficiaries/${b.id}`,
    }))).catch(() => []);

    if (role === USER_ROLES.ADMIN) {
      promises.users = userApi.search(params).then((r) => (r?.data?.content || []).map((u) => ({
        id: u.id, title: u.fullName || u.email, subtitle: `${u.role?.replace('_', ' ') || ''} • ${u.email || ''}`.trim(),
        path: `/admin/users/${u.id}`,
      }))).catch(() => []);
    }

    const entries = Object.entries(promises);
    const settled = await Promise.allSettled(entries.map(([, p]) => p));
    const merged = {};
    entries.forEach(([key], idx) => {
      const val = settled[idx].status === 'fulfilled' ? settled[idx].value : [];
      if (val.length > 0) merged[key] = val;
    });
    setResults(merged);
    setSearching(false);
  }, [role, prefix]);

  const onQueryChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 1) { setResults({}); setSearching(false); return; }
    setSearching(true);
    debounceRef.current = setTimeout(() => performSearch(val), 350);
  }, [performSearch]);

  const flatResults = Object.entries(results).flatMap(([cat, items]) =>
    items.map((item) => ({ ...item, category: cat }))
  );
  const totalCount = flatResults.length;
  const hasQuery = query.length >= 1;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { closeSearch(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx((p) => Math.min(p + 1, totalCount - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx((p) => Math.max(p - 1, 0)); }
    if (e.key === 'Enter' && selectedIdx >= 0 && flatResults[selectedIdx]) {
      navigate(flatResults[selectedIdx].path);
      closeSearch();
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="sticky top-0 z-30 bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between h-[72px] px-4 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button onClick={openMobile} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden transition-all duration-200 active:scale-95">
              <HiOutlineMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button onClick={toggle} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hidden lg:flex transition-all duration-200 active:scale-95">
              <HiOutlineMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm min-w-0 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 border border-gray-100 dark:border-gray-700">
            <HiOutlineHome className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                <HiOutlineChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                <span className={`truncate font-medium ${i === crumbs.length - 1 ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>{c}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Global Search */}
          <div className="relative" ref={searchContainerRef}>
            {showSearch ? (
              <div className="relative">
                <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-primary/30 shadow-lg shadow-primary/5 ring-2 ring-primary/10">
                  {searching ? (
                    <div className="w-4 h-4 flex-shrink-0"><Spinner size="xs" /></div>
                  ) : (
                    <HiOutlineSearch className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={onQueryChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Search cases, interventions, beneficiaries..."
                    className="bg-transparent text-sm outline-none w-56 lg:w-80 placeholder:text-gray-400"
                  />
                  {query && (
                    <button onClick={() => { setQuery(''); setResults({}); setSelectedIdx(-1); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <HiOutlineX className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Results dropdown */}
                {hasQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-gray-600 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                    {searching && totalCount === 0 ? (
                      <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                        <Spinner size="sm" /> <span className="text-sm">Searching...</span>
                      </div>
                    ) : totalCount === 0 ? (
                      <div className="py-10 text-center">
                        <HiOutlineSearch className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-500">No results for "{query}"</p>
                        <p className="text-xs text-gray-400 mt-1">Try different keywords or check the spelling</p>
                      </div>
                    ) : (
                      <>
                        <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500">{totalCount} result{totalCount !== 1 ? 's' : ''} found</span>
                        </div>
                        {Object.entries(results).map(([cat, items]) => {
                          const meta = CATEGORY_META[cat];
                          if (!meta || !items.length) return null;
                          const Icon = meta.icon;
                          return (
                            <div key={cat}>
                              <div className="px-4 py-2 flex items-center gap-2 border-b border-gray-50">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${meta.color}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{meta.label}</span>
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">{items.length}</span>
                              </div>
                              {items.map((item) => {
                                const globalIdx = flatResults.findIndex((f) => f.id === item.id && f.category === cat);
                                const isSelected = globalIdx === selectedIdx;
                                return (
                                  <button
                                    key={`${cat}-${item.id}`}
                                    onClick={() => { navigate(item.path); closeSearch(); }}
                                    onMouseEnter={() => setSelectedIdx(globalIdx)}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'}`}
                                  >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                      <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                                        {highlightMatch(item.title, query)}
                                      </p>
                                      {item.subtitle && (
                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.subtitle}</p>
                                      )}
                                    </div>
                                    <HiOutlineChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-gray-300'}`} />
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group"
                title="Search (Ctrl+K)"
              >
                <HiOutlineSearch className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
                <span className="hidden lg:inline text-sm text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400">Search...</span>
              </button>
            )}
          </div>

          {/* Messages */}
          <Link to={ROUTES.SHARED.MESSAGES} className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 group" title="Messages">
            <HiOutlineMail className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors" />
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown((p) => !p)}
              className={`relative p-2.5 rounded-xl transition-all duration-200 group ${showNotifDropdown ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Notifications"
            >
              <HiOutlineBell className={`w-5 h-5 transition-colors ${showNotifDropdown ? 'text-primary' : 'text-gray-500 group-hover:text-primary'}`} />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 top-full mt-3 w-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <HiOutlineBell className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <p className="text-[11px] text-gray-500">{unreadCount} unread</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllRead()}
                        className="text-[11px] font-semibold text-primary hover:text-primary-700 px-2.5 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[420px] overflow-y-auto">
                  {loadingRecent ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner size="sm" />
                    </div>
                  ) : recentNotifications.length === 0 ? (
                    <div className="py-14 text-center px-6">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <HiOutlineBell className="w-7 h-7 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-500">All caught up!</p>
                      <p className="text-xs text-gray-400 mt-1">No notifications right now</p>
                    </div>
                  ) : (
                    <div>
                      {recentNotifications.slice(0, 8).map((n) => {
                        const meta = getNotifMeta(n);
                        const Icon = meta.icon;
                        const link = getNotifLink(n, prefix);
                        return (
                          <button
                            key={n.id}
                            onClick={() => {
                              if (!n.isRead) markRead(n.id);
                              setShowNotifDropdown(false);
                              if (link) navigate(link);
                              else navigate(ROUTES.SHARED.NOTIFICATIONS);
                            }}
                            className={`w-full text-left flex items-start gap-3 px-5 py-3.5 transition-all duration-150 group/item border-b border-gray-50 last:border-0 ${
                              n.isRead
                                ? 'hover:bg-gray-50'
                                : 'bg-primary-50/30 hover:bg-primary-50/50'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ${meta.ring}`}>
                              <Icon className={`w-4 h-4 ${meta.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-[13px] leading-snug line-clamp-2 ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                  {n.title || n.message}
                                </p>
                                {!n.isRead && (
                                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5 ring-2 ring-primary/20" />
                                )}
                              </div>
                              {n.title && n.message && n.title !== n.message && (
                                <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{n.message}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] text-gray-400">{formatRelativeTime(n.sentAt || n.createdAt)}</span>
                                {(n.relatedCaseNumber || n.relatedCaseId) && (
                                  <span className="text-[10px] text-primary font-medium bg-primary-50 px-1.5 py-0.5 rounded">Case {n.relatedCaseNumber || `#${n.relatedCaseId}`}</span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {recentNotifications.length > 0 && (
                  <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">
                    <button
                      onClick={() => {
                        setShowNotifDropdown(false);
                        navigate(ROUTES.SHARED.NOTIFICATIONS);
                      }}
                      className="w-full text-center text-[13px] font-semibold text-primary hover:text-primary-700 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-px h-10 bg-gray-200 dark:bg-gray-600 mx-2" />

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center gap-3 pl-2 pr-3 py-2 rounded-xl transition-all duration-200 ${showDropdown ? 'bg-gray-100 dark:bg-gray-800 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <div className="relative">
                <UserAvatar user={user} size="sm" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full ring-2 ring-emerald-100" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight">{user?.fullName}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium capitalize">{user?.role?.replace('_', ' ')?.toLowerCase()}</p>
              </div>
              <HiOutlineChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 hidden sm:block transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50">
                <div className="px-3 pb-3 mb-2 border-b border-gray-100">
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-primary-50 via-primary-50 to-secondary-50 rounded-xl">
                    <div className="relative">
                      <UserAvatar user={user} size="lg" />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full ring-2 ring-emerald-100" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate mb-0.5">{user?.fullName}</p>
                      <p className="text-xs text-gray-600 truncate mb-2">{user?.email}</p>
                      <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold rounded-lg bg-white/80 text-primary border border-primary/20 capitalize">
                        {user?.role?.replace('_', ' ')?.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-2 space-y-1">
                  <Link to={ROUTES.SHARED.PROFILE} onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-xl group">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                      <HiOutlineUser className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1"><p className="font-semibold text-gray-900">My Profile</p><p className="text-[10px] text-gray-500">View & edit profile</p></div>
                    <HiOutlineChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                  <Link to={ROUTES.SHARED.CHANGE_PASSWORD} onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-xl group">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                      <HiOutlineLockClosed className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex-1"><p className="font-semibold text-gray-900">Change Password</p><p className="text-[10px] text-gray-500">Update security</p></div>
                    <HiOutlineChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                  <Link to={ROUTES.SHARED.SETTINGS} onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors rounded-xl group">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                      <HiOutlineCog className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1"><p className="font-semibold text-gray-900">Settings</p><p className="text-[10px] text-gray-500">Preferences</p></div>
                    <HiOutlineChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
                <div className="px-2 pt-2 mt-2 border-t border-gray-100">
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 text-sm text-red-600 hover:bg-red-50 w-full transition-all duration-200 rounded-xl group">
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 transition-colors">
                      <HiOutlineLogout className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="font-semibold flex-1 text-left">Sign Out</span>
                    <HiOutlineChevronRight className="w-4 h-4 text-red-300 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard shortcut */}
      <GlobalSearchShortcut onOpen={() => setShowSearch(true)} />
    </header>
  );
}

function GlobalSearchShortcut({ onOpen }) {
  useEffect(() => {
    function handle(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); onOpen(); }
    }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [onOpen]);
  return null;
}

function highlightMatch(text, query) {
  if (!text || !query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="bg-yellow-100 text-yellow-800 rounded px-0.5 font-semibold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
