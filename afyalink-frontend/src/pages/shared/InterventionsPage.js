import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { interventionApi } from '../../api/interventionApi';
import { caseApi } from '../../api/caseApi';
import { useAuth } from '../../context/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import { useSearch } from '../../hooks/useSearch';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Spinner from '../../components/common/Spinner';
import { formatDateTime } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';
import { canCreateIntervention } from '../../utils/permissions';
import { getPriorityColor } from '../../utils/getPriorityColor';
import {
  INTERVENTION_STATUSES, INTERVENTION_TYPES, CASE_PRIORITIES, USER_ROLES,
} from '../../utils/constants';
import UserAvatar from '../../components/shared/UserAvatar';
import Avatar from '../../components/shared/Avatar';
import {
  HiOutlinePlus, HiOutlineSearch, HiOutlineEye,
  HiOutlineCalendar, HiOutlineClock, HiOutlineLocationMarker,
  HiOutlineUser, HiOutlineDocumentText, HiOutlineClipboardCheck,
  HiOutlineStar, HiOutlinePlay, HiOutlineCheck, HiOutlineTrash,
  HiOutlineTag, HiOutlineExclamation, HiOutlineChartBar,
  HiOutlineFilter, HiOutlineClipboardList, HiOutlineUserGroup,
} from 'react-icons/hi';

const CATEGORIES = [
  'Social Support', 'Healthcare', 'Academic Support',
  'Psychosocial Support', 'Vocational', 'Crisis Support',
];

const createSchema = yup.object({
  title: yup.string().required('Title is required'),
  caseId: yup.number().required('Case is required').typeError('Select a case'),
  type: yup.string().oneOf(Object.values(INTERVENTION_TYPES)).required('Type is required'),
  category: yup.string().nullable(),
  description: yup.string().required('Description is required'),
  priority: yup.string().oneOf(Object.values(CASE_PRIORITIES)).nullable(),
  location: yup.string().nullable(),
  plannedStartDatetime: yup.string().required('Start date/time is required'),
  plannedEndDatetime: yup.string().nullable(),
  durationMinutes: yup.number().nullable().typeError('Must be a number'),
  outcomesPlanned: yup.string().nullable(),
  resources: yup.string().nullable(),
});

function getStatusColor(status) {
  const map = {
    PLANNED: 'bg-gray-100 text-gray-700 border-gray-300',
    SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-300',
    IN_PROGRESS: 'bg-orange-100 text-orange-700 border-orange-300',
    COMPLETED: 'bg-green-100 text-green-700 border-green-300',
  };
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function getStatusIcon(status) {
  const map = {
    PLANNED: <HiOutlineClipboardList className="w-4 h-4" />,
    SCHEDULED: <HiOutlineCalendar className="w-4 h-4" />,
    IN_PROGRESS: <HiOutlinePlay className="w-4 h-4" />,
    COMPLETED: <HiOutlineCheck className="w-4 h-4" />,
  };
  return map[status] || <HiOutlineClipboardList className="w-4 h-4" />;
}

function getTypeIcon(type) {
  const map = {
    HOME_VISIT: <HiOutlineLocationMarker className="w-4 h-4" />,
    MEDICAL: <HiOutlineClipboardCheck className="w-4 h-4" />,
    EDUCATION: <HiOutlineDocumentText className="w-4 h-4" />,
    COUNSELING: <HiOutlineUser className="w-4 h-4" />,
    TRAINING: <HiOutlineChartBar className="w-4 h-4" />,
    EMERGENCY: <HiOutlineExclamation className="w-4 h-4" />,
  };
  return map[type] || <HiOutlineCalendar className="w-4 h-4" />;
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function EffectivenessBar({ value }) {
  if (value == null) return null;
  const barColor = value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">Effectiveness</span>
        <span className="font-bold text-gray-700">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StarRating({ value, onChange, readonly = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <HiOutlineStar
            className={`w-6 h-6 ${star <= (value || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
      {value > 0 && <span className="ml-1 text-sm font-semibold text-gray-600">{value}/5</span>}
    </div>
  );
}

export default function InterventionsPage() {
  const { user } = useAuth();
  const role = user?.role;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, planned: 0, scheduled: 0, inProgress: 0, completed: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination();
  const { page: pgPage, size: pgSize, updateFromResponse } = pagination;

  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [outcomeForm, setOutcomeForm] = useState({
    completionNotes: '',
    effectivenessPercent: 75,
    outcomesActual: '',
  });

  const [reviewForm, setReviewForm] = useState({
    effectivenessStarRating: 3,
    supervisorComments: '',
  });

  const {
    register, handleSubmit, formState: { errors }, reset,
  } = useForm({ resolver: yupResolver(createSchema), defaultValues: { priority: 'MEDIUM', type: 'HOME_VISIT' } });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (debouncedKeyword) {
        res = await interventionApi.search({ keyword: debouncedKeyword, page: pgPage, size: pgSize });
      } else if (statusFilter) {
        res = await interventionApi.getByStatus(statusFilter, { page: pgPage, size: pgSize });
      } else if (typeFilter) {
        res = await interventionApi.getByType(typeFilter, { page: pgPage, size: pgSize });
      } else {
        res = await interventionApi.getAll({ page: pgPage, size: pgSize, sortBy: 'id', direction: 'DESC' });
      }
      const payload = res?.data !== undefined ? res.data : res;
      setData(Array.isArray(payload?.content) ? payload.content : []);
      updateFromResponse(payload);
      const statsRes = await interventionApi.getStats().catch(() => null);
      const statsPayload = statsRes?.data !== undefined ? statsRes.data : statsRes;
      if (statsPayload && typeof statsPayload.total === 'number') {
        setStats({
          total: statsPayload.total ?? 0,
          planned: statsPayload.planned ?? 0,
          scheduled: statsPayload.scheduled ?? 0,
          inProgress: statsPayload.inProgress ?? 0,
          completed: statsPayload.completed ?? 0,
        });
      }
    } catch {
      toast.error('Failed to load interventions');
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, statusFilter, typeFilter, pgPage, pgSize, updateFromResponse]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await caseApi.getAll({ page: 0, size: 500 });
        const payload = res?.data !== undefined ? res.data : res;
        setCases(Array.isArray(payload?.content) ? payload.content : []);
      } catch { /* silent */ }
    }
    loadCases();
  }, []);

  const statsForCards = {
    total: stats.total,
    planned: stats.planned,
    scheduled: stats.scheduled,
    inProgress: stats.inProgress,
    completed: stats.completed,
  };

  const openDetail = async (item) => {
    setShowDetail(true);
    setDetailLoading(true);
    try {
      const res = await interventionApi.getById(item.id);
      setSelected(res?.data);
    } catch {
      toast.error('Failed to load details');
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const onCreateSubmit = async (formData) => {
    setCreateLoading(true);
    try {
      const payload = {
        ...formData,
        plannedStartDatetime: formData.plannedStartDatetime ? formData.plannedStartDatetime + ':00' : null,
        plannedEndDatetime: formData.plannedEndDatetime ? formData.plannedEndDatetime + ':00' : null,
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : null,
      };
      await interventionApi.create(payload);
      toast.success('Intervention created successfully');
      setShowCreate(false);
      reset();
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create intervention');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setActionLoading(true);
    try {
      await interventionApi.update(id, { status: newStatus });
      toast.success(`Status updated to ${formatEnum(newStatus)}`);
      fetchData();
      if (selected?.id === id) {
        const res = await interventionApi.getById(id);
        setSelected(res?.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteWithOutcome = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await interventionApi.update(selected.id, {
        status: 'COMPLETED',
        completionNotes: outcomeForm.completionNotes,
        effectivenessPercent: outcomeForm.effectivenessPercent,
        outcomesActual: outcomeForm.outcomesActual,
      });
      toast.success('Intervention completed successfully');
      setShowOutcome(false);
      setOutcomeForm({ completionNotes: '', effectivenessPercent: 75, outcomesActual: '' });
      fetchData();
      const res = await interventionApi.getById(selected.id);
      setSelected(res?.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to complete intervention');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await interventionApi.update(selected.id, {
        effectivenessStarRating: reviewForm.effectivenessStarRating,
        supervisorComments: reviewForm.supervisorComments,
      });
      toast.success('Review submitted successfully');
      setShowReview(false);
      setReviewForm({ effectivenessStarRating: 3, supervisorComments: '' });
      fetchData();
      const res = await interventionApi.getById(selected.id);
      setSelected(res?.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this intervention?')) return;
    try {
      await interventionApi.remove(id);
      toast.success('Intervention deleted');
      setShowDetail(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete');
    }
  };

  const roleTitle = {
    [USER_ROLES.ADMIN]: 'All Interventions',
    [USER_ROLES.SUPERVISOR]: 'Team Interventions',
    [USER_ROLES.SOCIAL_WORKER]: 'My Interventions',
  };

  const roleSubtitle = {
    [USER_ROLES.ADMIN]: 'System-wide intervention oversight and analytics',
    [USER_ROLES.SUPERVISOR]: 'Plan, assign, and review team interventions',
    [USER_ROLES.SOCIAL_WORKER]: 'Manage your assigned interventions',
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge={roleTitle[role] || 'Interventions'}
        badgeIcon={HiOutlineClipboardList}
        title={roleTitle[role] || 'Interventions'}
        subtitle={roleSubtitle[role] || 'Manage interventions'}
        action={canCreateIntervention(role) && (
          <Button variant="header" onClick={() => setShowCreate(true)} icon={HiOutlinePlus}>
            Plan Intervention
          </Button>
        )}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<HiOutlineClipboardList className="w-5 h-5 text-indigo-600" />}
          label="Total" value={statsForCards.total}
          color="bg-indigo-50"
        />
        <StatCard
          icon={<HiOutlineDocumentText className="w-5 h-5 text-gray-600" />}
          label="Planned" value={statsForCards.planned}
          color="bg-gray-50"
        />
        <StatCard
          icon={<HiOutlineCalendar className="w-5 h-5 text-blue-600" />}
          label="Scheduled" value={statsForCards.scheduled}
          color="bg-blue-50"
        />
        <StatCard
          icon={<HiOutlineClock className="w-5 h-5 text-orange-600" />}
          label="In Progress" value={statsForCards.inProgress}
          color="bg-orange-50"
        />
        <StatCard
          icon={<HiOutlineCheck className="w-5 h-5 text-green-600" />}
          label="Completed" value={statsForCards.completed}
          color="bg-green-50"
        />
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => { handleSearch(e); pagination.resetPage?.(); }}
              placeholder="Search by title, code, case..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setTypeFilter(''); pagination.resetPage?.(); }}
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white min-w-[140px]"
            >
              <option value="">All Status</option>
              {Object.entries(INTERVENTION_STATUSES).map(([k, v]) => (
                <option key={k} value={v}>{formatEnum(v)}</option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setStatusFilter(''); pagination.resetPage?.(); }}
              className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white min-w-[140px]"
            >
              <option value="">All Types</option>
              {Object.entries(INTERVENTION_TYPES).map(([k, v]) => (
                <option key={k} value={v}>{formatEnum(v)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Interventions List */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiOutlineClipboardList className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">No interventions found</p>
          <p className="text-gray-400 text-sm mt-1">
            {debouncedKeyword || statusFilter || typeFilter ? 'Try adjusting your filters' : 'Create your first intervention to get started'}
          </p>
          {canCreateIntervention(role) && !debouncedKeyword && !statusFilter && !typeFilter && (
            <Button className="mt-4" onClick={() => setShowCreate(true)} icon={HiOutlinePlus}>
              Plan Intervention
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all p-5 cursor-pointer group/card"
              onClick={() => openDetail(item)}
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-md bg-teal-50 text-teal-600">{getTypeIcon(item.type)}</div>
                        <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)} {formatEnum(item.status)}
                        </span>
                        {item.priority && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                            {formatEnum(item.priority)}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                          {formatEnum(item.type)}
                        </span>
                        {item.interventionCode && (
                          <span className="text-xs text-gray-400 font-mono">{item.interventionCode}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
                    {item.caseNumber && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <HiOutlineDocumentText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Case: <span className="text-gray-700 font-medium">{item.caseNumber}</span></span>
                      </div>
                    )}
                    {item.plannedStartDatetime && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <HiOutlineCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{formatDateTime(item.plannedStartDatetime)}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <HiOutlineLocationMarker className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{item.location}</span>
                      </div>
                    )}
                    {item.durationMinutes && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <HiOutlineClock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{item.durationMinutes} min</span>
                      </div>
                    )}
                    {(item.assignedStaff?.length > 0 || item.plannedBy) && (
                      <div className="flex items-center gap-1.5 text-gray-500 sm:col-span-2">
                        {item.assignedStaff?.length > 0 ? (
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            {item.assignedStaff.slice(0, 2).map((s, i) => (
                              <div key={s.id || i} className="flex items-center gap-1.5">
                                <Avatar name={s.userFullName} size="xs" className="flex-shrink-0" />
                                <span className="text-sm text-gray-700">{s.userFullName || s.userEmail}</span>
                                {s.supervisorName && <span className="text-xs text-gray-500">↳ {s.supervisorName}</span>}
                              </div>
                            ))}
                            {item.assignedStaff.length > 2 && <span className="text-xs text-gray-400">+{item.assignedStaff.length - 2}</span>}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserAvatar user={item.plannedBy} size="xs" />
                            <span>By: <span className="text-gray-700 font-medium">{item.plannedBy.fullName}</span></span>
                          </div>
                        )}
                      </div>
                    )}
                    {item.category && (
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <HiOutlineTag className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{item.category}</span>
                      </div>
                    )}
                  </div>

                  <EffectivenessBar value={item.effectivenessPercent} />

                  {/* Supervisor Review Badge */}
                  {item.supervisorComments && item.effectivenessStarRating && (
                    <div className="flex items-center gap-2 pt-1">
                      <HiOutlineClipboardCheck className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">Reviewed</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <HiOutlineStar key={s} className={`w-3.5 h-3.5 ${s <= item.effectivenessStarRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex lg:flex-col gap-2 justify-end flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openDetail(item)}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    title="View Details"
                  >
                    <HiOutlineEye className="w-5 h-5" />
                  </button>

                  {/* Social worker: start scheduled */}
                  {role === USER_ROLES.SOCIAL_WORKER && item.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'IN_PROGRESS')}
                      className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"
                      title="Start"
                    >
                      <HiOutlinePlay className="w-5 h-5" />
                    </button>
                  )}

                  {/* Social worker: complete in-progress */}
                  {role === USER_ROLES.SOCIAL_WORKER && item.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => { setSelected(item); setShowOutcome(true); }}
                      className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                      title="Complete"
                    >
                      <HiOutlineCheck className="w-5 h-5" />
                    </button>
                  )}

                  {/* Supervisor: review completed */}
                  {role === USER_ROLES.SUPERVISOR && item.status === 'COMPLETED' && !item.supervisorComments && (
                    <button
                      onClick={() => { setSelected(item); setShowReview(true); }}
                      className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors"
                      title="Review"
                    >
                      <HiOutlineStar className="w-5 h-5" />
                    </button>
                  )}

                  {/* Admin: delete */}
                  {role === USER_ROLES.ADMIN && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalElements={pagination.totalElements}
        onPageChange={pagination.goToPage}
      />

      {/* ─── Create Intervention Modal ─── */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); reset(); }}
        title="Plan New Intervention"
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowCreate(false); reset(); }}>Cancel</Button>
            <Button loading={createLoading} onClick={handleSubmit(onCreateSubmit)}>Create Intervention</Button>
          </>
        }
      >
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <HiOutlineDocumentText className="w-4 h-4 text-teal-600" /> Basic Information
            </h3>
            <div className="space-y-4">
              <Input label="Intervention Title *" register={register('title')} error={errors.title?.message} placeholder="e.g., Home Visit - John Mukiza" />
              <Select
                label="Case *"
                register={register('caseId')}
                error={errors.caseId?.message}
                options={cases.map((c) => ({ value: c.id, label: `${c.caseNumber || c.id} - ${c.title}` }))}
                placeholder="Select a case"
              />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Type *" register={register('type')} error={errors.type?.message}
                  options={Object.values(INTERVENTION_TYPES).map((t) => ({ value: t, label: formatEnum(t) }))} />
                <Select label="Category" register={register('category')}
                  options={CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder="Select category" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Priority" register={register('priority')}
                  options={Object.values(CASE_PRIORITIES).map((p) => ({ value: p, label: formatEnum(p) }))} />
                <Input label="Location" register={register('location')} placeholder="e.g., Health Center, Gasabo" />
              </div>
              <Textarea label="Description *" register={register('description')} error={errors.description?.message} rows={3} placeholder="Describe the purpose and objectives..." />
            </div>
          </div>

          {/* Scheduling */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <HiOutlineCalendar className="w-4 h-4 text-teal-600" /> Scheduling
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date & Time *" type="datetime-local" register={register('plannedStartDatetime')} error={errors.plannedStartDatetime?.message} />
              <Input label="End Date & Time" type="datetime-local" register={register('plannedEndDatetime')} />
              <Input label="Duration (minutes)" type="number" register={register('durationMinutes')} placeholder="e.g., 120" />
            </div>
          </div>

          {/* Outcomes & Resources */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <HiOutlineClipboardCheck className="w-4 h-4 text-teal-600" /> Outcomes & Resources
            </h3>
            <div className="space-y-4">
              <Textarea label="Expected Outcomes" register={register('outcomesPlanned')} rows={3} placeholder="List expected outcomes for this intervention..." />
              <Textarea label="Resources Needed" register={register('resources')} rows={2} placeholder="Transportation, medical supplies, forms..." />
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── Detail Modal ─── */}
      <Modal
        isOpen={showDetail}
        onClose={() => { setShowDetail(false); setSelected(null); }}
        title="Intervention Details"
        size="xl"
        footer={
          <div className="flex gap-2 w-full justify-between">
            <div className="flex gap-2">
              {role === USER_ROLES.SOCIAL_WORKER && selected?.status === 'SCHEDULED' && (
                <Button onClick={() => handleStatusChange(selected.id, 'IN_PROGRESS')} loading={actionLoading}>
                  <HiOutlinePlay className="w-4 h-4 mr-1" /> Start
                </Button>
              )}
              {role === USER_ROLES.SOCIAL_WORKER && selected?.status === 'IN_PROGRESS' && (
                <Button onClick={() => { setShowDetail(false); setShowOutcome(true); }}>
                  <HiOutlineCheck className="w-4 h-4 mr-1" /> Complete
                </Button>
              )}
              {role === USER_ROLES.SUPERVISOR && selected?.status === 'COMPLETED' && !selected?.supervisorComments && (
                <Button onClick={() => { setShowDetail(false); setShowReview(true); }}>
                  <HiOutlineStar className="w-4 h-4 mr-1" /> Review
                </Button>
              )}
              {role === USER_ROLES.ADMIN && (
                <Button variant="danger" onClick={() => selected && handleDelete(selected.id)}>
                  <HiOutlineTrash className="w-4 h-4 mr-1" /> Delete
                </Button>
              )}
            </div>
            <Button variant="ghost" onClick={() => { setShowDetail(false); setSelected(null); }}>Close</Button>
          </div>
        }
      >
        {detailLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : selected ? (
          <div className="space-y-6">
            {/* Title & Badges */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600">{getTypeIcon(selected.type)}</div>
                <h3 className="text-xl font-bold text-gray-900">{selected.title}</h3>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(selected.status)}`}>
                  {getStatusIcon(selected.status)} {formatEnum(selected.status)}
                </span>
                {selected.priority && (
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selected.priority)}`}>
                    {formatEnum(selected.priority)} Priority
                  </span>
                )}
                <span className="text-xs text-gray-400 font-mono">{selected.interventionCode}</span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Case Number', value: selected.caseNumber, icon: <HiOutlineDocumentText className="w-4 h-4" /> },
                { label: 'Type', value: formatEnum(selected.type), icon: <HiOutlineTag className="w-4 h-4" /> },
                { label: 'Category', value: selected.category || '—', icon: <HiOutlineFilter className="w-4 h-4" /> },
                { label: 'Location', value: selected.location || '—', icon: <HiOutlineLocationMarker className="w-4 h-4" /> },
                { label: 'Start', value: selected.plannedStartDatetime ? formatDateTime(selected.plannedStartDatetime) : '—', icon: <HiOutlineCalendar className="w-4 h-4" /> },
                { label: 'End', value: selected.plannedEndDatetime ? formatDateTime(selected.plannedEndDatetime) : '—', icon: <HiOutlineCalendar className="w-4 h-4" /> },
                { label: 'Duration', value: selected.durationMinutes ? `${selected.durationMinutes} min` : '—', icon: <HiOutlineClock className="w-4 h-4" /> },
                { label: 'Planned By', value: selected.plannedBy?.fullName || '—', icon: <HiOutlineUser className="w-4 h-4" /> },
              ].map((f, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">{f.icon} {f.label}</div>
                  <p className="font-medium text-gray-800 text-sm">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Staff & Supervisor (admin) */}
            {selected.assignedStaff?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <HiOutlineUserGroup className="w-4 h-4" /> Assigned Staff & Supervisors
                </h4>
                <div className="space-y-3">
                  {selected.assignedStaff.map((s, i) => (
                    <div key={s.id || i} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-gray-100">
                      <Avatar name={s.userFullName} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{s.userFullName || s.userEmail}</p>
                        {s.supervisorName && <p className="text-sm text-gray-500">Supervisor: {s.supervisorName}</p>}
                        {s.roleInIntervention && <p className="text-xs text-gray-400">{s.roleInIntervention}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {selected.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{selected.description}</p>
              </div>
            )}

            {/* Planned Outcomes */}
            {selected.outcomesPlanned && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Expected Outcomes</h4>
                <p className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-100">{selected.outcomesPlanned}</p>
              </div>
            )}

            {/* Resources */}
            {selected.resources && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Resources</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selected.resources}</p>
              </div>
            )}

            {/* Completion Section */}
            {selected.status === 'COMPLETED' && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
                  <HiOutlineCheck className="w-4 h-4" /> Completion Details
                </h4>
                {selected.completionNotes && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Completion Notes</p>
                    <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3 border border-green-100">{selected.completionNotes}</p>
                  </div>
                )}
                {selected.outcomesActual && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Actual Outcomes</p>
                    <p className="text-sm text-gray-700 bg-green-50 rounded-lg p-3 border border-green-100">{selected.outcomesActual}</p>
                  </div>
                )}
                <EffectivenessBar value={selected.effectivenessPercent} />
              </div>
            )}

            {/* Supervisor Review */}
            {selected.supervisorComments && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-yellow-700 flex items-center gap-1.5 mb-3">
                  <HiOutlineStar className="w-4 h-4" /> Supervisor Review
                </h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
                  {selected.effectivenessStarRating && (
                    <StarRating value={selected.effectivenessStarRating} readonly />
                  )}
                  <p className="text-sm text-gray-700 italic">"{selected.supervisorComments}"</p>
                  {selected.approvedBy && (
                    <p className="text-xs text-gray-500">Reviewed by {selected.approvedBy.fullName}</p>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
              <div>Created: {formatDateTime(selected.createdAt)}</div>
              <div>Updated: {formatDateTime(selected.updatedAt)}</div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ─── Complete with Outcome Modal ─── */}
      <Modal
        isOpen={showOutcome}
        onClose={() => { setShowOutcome(false); setOutcomeForm({ completionNotes: '', effectivenessPercent: 75, outcomesActual: '' }); }}
        title="Complete Intervention & Add Outcomes"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowOutcome(false)}>Cancel</Button>
            <Button loading={actionLoading} onClick={handleCompleteWithOutcome}>
              <HiOutlineCheck className="w-4 h-4 mr-1" /> Complete Intervention
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800">{selected.title}</h4>
              <p className="text-sm text-gray-500 mt-1">Case: {selected.caseNumber} | {formatEnum(selected.type)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Actual Outcomes Achieved *</label>
              <textarea
                value={outcomeForm.outcomesActual}
                onChange={(e) => setOutcomeForm((p) => ({ ...p, outcomesActual: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Describe what was actually achieved during this intervention..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Completion Notes *</label>
              <textarea
                value={outcomeForm.completionNotes}
                onChange={(e) => setOutcomeForm((p) => ({ ...p, completionNotes: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Additional notes, observations, or recommendations..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Effectiveness Rating</label>
                <span className="text-2xl font-bold text-primary">{outcomeForm.effectivenessPercent}%</span>
              </div>
              <input
                type="range" min="0" max="100"
                value={outcomeForm.effectivenessPercent}
                onChange={(e) => setOutcomeForm((p) => ({ ...p, effectivenessPercent: parseInt(e.target.value) }))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Not Effective</span>
                <span>Partially</span>
                <span>Highly Effective</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Supervisor Review Modal ─── */}
      <Modal
        isOpen={showReview}
        onClose={() => { setShowReview(false); setReviewForm({ effectivenessStarRating: 3, supervisorComments: '' }); }}
        title="Review & Approve Intervention"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReview(false)}>Cancel</Button>
            <Button loading={actionLoading} onClick={handleSubmitReview}>
              <HiOutlineStar className="w-4 h-4 mr-1" /> Submit Review
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            {/* Intervention Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-gray-800">{selected.title}</h4>
              <p className="text-sm text-gray-500">Case: {selected.caseNumber} | {formatEnum(selected.type)}</p>
              {selected.completionNotes && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Worker's Completion Notes:</p>
                  <p className="text-sm text-gray-700">{selected.completionNotes}</p>
                </div>
              )}
              {selected.effectivenessPercent != null && (
                <div className="pt-2">
                  <EffectivenessBar value={selected.effectivenessPercent} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
              <StarRating
                value={reviewForm.effectivenessStarRating}
                onChange={(v) => setReviewForm((p) => ({ ...p, effectivenessStarRating: v }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Supervisor Comments *</label>
              <textarea
                value={reviewForm.supervisorComments}
                onChange={(e) => setReviewForm((p) => ({ ...p, supervisorComments: e.target.value }))}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Provide feedback on the intervention execution and outcomes..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
