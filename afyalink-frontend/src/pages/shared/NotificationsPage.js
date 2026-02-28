import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { notificationApi } from '../../api/notificationApi';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import { useSearch } from '../../hooks/useSearch';
import { ROUTES } from '../../routes/routeConstants';
import { USER_ROLES } from '../../utils/constants';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatRelativeTime } from '../../utils/formatDate';
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineCheck,
  HiOutlineChat,
  HiOutlineExclamation,
  HiOutlineFolder,
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineDocumentReport,
  HiOutlineChevronRight,
  HiOutlineFilter,
  HiOutlineTrash,
  HiOutlineInbox,
} from 'react-icons/hi';

function getRolePrefix(role) {
  if (role === USER_ROLES.ADMIN) return '/admin';
  if (role === USER_ROLES.SUPERVISOR) return '/supervisor';
  return '/social-worker';
}

function getNotifMeta(n) {
  const t = (n.type || n.notificationType || '').toUpperCase();
  const msg = (n.message || n.title || '').toLowerCase();
  if (t.includes('MESSAGE') || t.includes('CHAT') || msg.includes('message'))
    return { icon: HiOutlineChat, bg: 'bg-blue-50', color: 'text-blue-600', ring: 'ring-blue-100', label: 'Message' };
  if (t.includes('WARNING') || t.includes('ALERT') || msg.includes('warning') || msg.includes('formal notice'))
    return { icon: HiOutlineExclamation, bg: 'bg-amber-50', color: 'text-amber-600', ring: 'ring-amber-100', label: 'Warning' };
  if (t.includes('CASE') || msg.includes('case'))
    return { icon: HiOutlineFolder, bg: 'bg-violet-50', color: 'text-violet-600', ring: 'ring-violet-100', label: 'Case' };
  if (t.includes('INTERVENTION') || msg.includes('intervention'))
    return { icon: HiOutlineClipboardList, bg: 'bg-emerald-50', color: 'text-emerald-600', ring: 'ring-emerald-100', label: 'Intervention' };
  if (t.includes('REPORT') || msg.includes('report'))
    return { icon: HiOutlineDocumentReport, bg: 'bg-cyan-50', color: 'text-cyan-600', ring: 'ring-cyan-100', label: 'Report' };
  if (t.includes('SCHEDULE') || t.includes('REMINDER') || msg.includes('schedule') || msg.includes('reminder'))
    return { icon: HiOutlineCalendar, bg: 'bg-orange-50', color: 'text-orange-600', ring: 'ring-orange-100', label: 'Reminder' };
  if (t.includes('USER') || t.includes('ASSIGN') || msg.includes('assign'))
    return { icon: HiOutlineUsers, bg: 'bg-pink-50', color: 'text-pink-600', ring: 'ring-pink-100', label: 'Assignment' };
  if (t.includes('SYSTEM') || t.includes('SECURITY'))
    return { icon: HiOutlineShieldCheck, bg: 'bg-slate-100', color: 'text-slate-600', ring: 'ring-slate-200', label: 'System' };
  return { icon: HiOutlineBell, bg: 'bg-primary-50', color: 'text-primary', ring: 'ring-primary-100', label: 'Notification' };
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

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { markRead, markAllRead, refresh } = useNotifications();
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination();
  const prefix = getRolePrefix(user?.role);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (debouncedKeyword) {
        res = await notificationApi.search({ keyword: debouncedKeyword, page: pagination.page, size: pagination.size });
      } else if (filter === 'unread') {
        res = await notificationApi.getUnread({ page: pagination.page, size: pagination.size });
      } else {
        res = await notificationApi.getAll({ page: pagination.page, size: pagination.size, sortBy: 'createdAt', direction: 'DESC' });
      }
      const raw = res?.data !== undefined ? res.data : res;
      const list = Array.isArray(raw?.content) ? raw.content : (Array.isArray(raw) ? raw : []);
      let filtered = list;
      if (filter === 'read' && !debouncedKeyword) {
        filtered = list.filter((n) => n.isRead);
      }
      setNotifications(filtered);
      pagination.updateFromResponse(raw || {});
    } catch {
      toast.error('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, pagination.page, pagination.size, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMarkRead = async (id) => {
    try {
      await markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch { toast.error('Failed to mark as read'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { toast.error('Failed'); }
  };

  const handleClick = (n) => {
    if (!n.isRead) handleMarkRead(n.id);
    const link = getNotifLink(n, prefix);
    if (link) navigate(link);
  };

  const unreadInList = notifications.filter((n) => !n.isRead).length;

  const groupByDate = (list) => {
    const groups = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    list.forEach((n) => {
      const d = new Date(n.sentAt || n.createdAt);
      d.setHours(0, 0, 0, 0);
      let label;
      if (d.getTime() === today.getTime()) label = 'Today';
      else if (d.getTime() === yesterday.getTime()) label = 'Yesterday';
      else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (!groups[label]) groups[label] = [];
      groups[label].push(n);
    });
    return Object.entries(groups);
  };

  const grouped = groupByDate(notifications);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <HiOutlineBell className="w-5.5 h-5.5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Notifications</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {unreadInList > 0
                    ? `${unreadInList} unread notification${unreadInList !== 1 ? 's' : ''}`
                    : 'You\'re all caught up'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadInList > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="text-primary hover:bg-primary-50"
                >
                  <HiOutlineCheckCircle className="w-4 h-4 mr-1.5" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Filter tabs + search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5">
            <div className="flex items-center gap-1 bg-gray-100/80 rounded-xl p-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setFilter(tab.key); pagination.goToPage(0); }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                    filter === tab.key
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <SearchBar
              value={keyword}
              onChange={handleSearch}
              placeholder="Search notifications..."
              className="max-w-xs"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <HiOutlineInbox className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-lg font-semibold text-gray-500">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                {filter === 'unread'
                  ? 'Great job! You\'ve read all your notifications.'
                  : 'When something changes (case updates, new messages, reminders), you\'ll see it here.'}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 text-sm font-semibold text-primary hover:text-primary-700 transition-colors"
                >
                  View all notifications
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{dateLabel}</span>
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((n) => {
                      const meta = getNotifMeta(n);
                      const Icon = meta.icon;
                      const link = getNotifLink(n, prefix);
                      const isClickable = !!link;
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleClick(n)}
                          className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 group ${
                            isClickable ? 'cursor-pointer' : ''
                          } ${
                            n.isRead
                              ? 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                              : 'bg-gradient-to-r from-primary-50/40 to-white border-primary-100 hover:border-primary-200 hover:shadow-md shadow-sm'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0 ring-1 ${meta.ring} transition-transform group-hover:scale-105`}>
                            <Icon className={`w-5 h-5 ${meta.color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {!n.isRead && (
                                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 ring-2 ring-primary/20" />
                                  )}
                                  <p className={`text-sm leading-snug ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-semibold'}`}>
                                    {n.title || n.message}
                                  </p>
                                </div>
                                {n.title && n.message && n.title !== n.message && (
                                  <p className="text-[13px] text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[11px] text-gray-400">{formatRelativeTime(n.sentAt || n.createdAt)}</span>
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>{meta.label}</span>
                                  {(n.relatedCaseNumber || n.relatedCaseId) && (
                                    <span className="text-[10px] text-primary font-medium bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100">
                                      Case {n.relatedCaseNumber || `#${n.relatedCaseId}`}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {!n.isRead && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Mark as read"
                                  >
                                    <HiOutlineCheck className="w-4 h-4" />
                                  </button>
                                )}
                                {isClickable && (
                                  <div className="p-1.5 text-gray-300 group-hover:text-primary transition-colors">
                                    <HiOutlineChevronRight className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && notifications.length > 0 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalElements={pagination.totalElements}
              onPageChange={pagination.goToPage}
              className="mt-8"
            />
          )}
        </div>
      </div>
    </div>
  );
}
