import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { interventionApi } from '../../api/interventionApi';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/layout/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';
import { INTERVENTION_STATUSES, INTERVENTION_TYPES } from '../../utils/constants';
import {
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineClipboardList,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineSearch,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineLightningBolt,
  HiOutlineChartBar,
  HiOutlineRefresh,
  HiOutlineFolderOpen,
  HiOutlineUser,
  HiOutlineBookOpen,
  HiOutlineExternalLink,
} from 'react-icons/hi';

function averageEffectivenessFromList(interventions) {
  const completedWithEffectiveness = interventions.filter(
    (i) => i.status === 'COMPLETED' && i.effectivenessPercent != null
  );
  if (completedWithEffectiveness.length === 0) return 0;
  const total = completedWithEffectiveness.reduce(
    (sum, i) => sum + i.effectivenessPercent,
    0
  );
  return Math.round(total / completedWithEffectiveness.length);
}

export default function MyInterventionsPage() {
  const navigate = useNavigate();
  const {
    page,
    size,
    totalPages,
    totalElements,
    goToPage,
    resetPage,
    updateFromResponse,
  } = usePagination();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    planned: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    avgEffectiveness: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        sortBy: 'id',
        direction: 'DESC',
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
        ...(searchQuery && { keyword: searchQuery }),
      };

      const [res, statsRes] = await Promise.all([
        interventionApi.getAll(params),
        interventionApi.getStats().catch(() => null),
      ]);

      const pageData = res?.data;
      const interventions = pageData?.content || [];
      setData(interventions);
      updateFromResponse(pageData);

      const statsPayload = statsRes?.data ?? statsRes;
      if (statsPayload && typeof statsPayload.total === 'number') {
        setStats((prev) => ({
          total: statsPayload.total ?? 0,
          planned: statsPayload.planned ?? 0,
          scheduled: statsPayload.scheduled ?? 0,
          inProgress: statsPayload.inProgress ?? 0,
          completed: statsPayload.completed ?? 0,
          avgEffectiveness: prev.avgEffectiveness,
        }));
      }

      const avg = averageEffectivenessFromList(interventions);
      setStats((s) => ({ ...s, avgEffectiveness: avg }));
    } catch (error) {
      toast.error('Failed to load interventions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery, page, size, updateFromResponse]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id) => {
    if (!window.confirm('⚠️ Are you sure? This will also update the case progress and schedule.')) return;
    try {
      await interventionApi.delete(id);
      toast.success('✅ Intervention deleted. Case and schedule updated automatically.');
      fetchData();
    } catch (error) {
      toast.error(error?.message || 'Failed to delete intervention');
    }
  };

  const handleQuickStatusUpdate = async (id, newStatus) => {
    try {
      await interventionApi.update(id, { status: newStatus });
      toast.success('✅ Status updated! Case progress and schedule synced automatically.');
      fetchData();
    } catch (error) {
      toast.error(error?.message || 'Failed to update status');
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">

      <PageHeader
        badge="Interventions Management"
        badgeIcon={HiOutlineClipboardList}
        title="My Interventions"
        subtitle="View, edit, or delete interventions — open the linked case or case entries anytime"
        action={
          <Link to="/social-worker/interventions/create">
            <button type="button" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/20 text-white border border-white/30 hover:bg-white/30 transition-all">
              <HiOutlinePlus className="w-5 h-5" />
              New Intervention
            </button>
          </Link>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatsCard
          icon={HiOutlineClipboardList}
          label="Total"
          value={stats.total}
          color="bg-gray-100 text-gray-700"
        />
        <StatsCard
          icon={HiOutlineClock}
          label="Planned"
          value={stats.planned}
          color="bg-blue-50 text-blue-600"
        />
        <StatsCard
          icon={HiOutlineCalendar}
          label="Scheduled"
          value={stats.scheduled}
          color="bg-amber-50 text-amber-600"
        />
        <StatsCard
          icon={HiOutlineLightningBolt}
          label="In Progress"
          value={stats.inProgress}
          color="bg-orange-50 text-orange-600"
        />
        <StatsCard
          icon={HiOutlineCheckCircle}
          label="Completed"
          value={stats.completed}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatsCard
          icon={HiOutlineChartBar}
          label="Avg. effectiveness"
          value={stats.avgEffectiveness ? `${stats.avgEffectiveness}%` : '—'}
          color="bg-primary-50 text-primary"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search interventions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                resetPage();
              }}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetPage();
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="">All Status</option>
            {Object.values(INTERVENTION_STATUSES).map((status) => (
              <option key={status} value={status}>{formatEnum(status)}</option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              resetPage();
            }}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          >
            <option value="">All Types</option>
            {Object.values(INTERVENTION_TYPES).map((type) => (
              <option key={type} value={type}>{formatEnum(type)}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchData}
            className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <HiOutlineRefresh className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Interventions list */}
      {data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-12 text-center">
          <HiOutlineClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No interventions found</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first intervention</p>
          <Link to="/social-worker/interventions/create">
            <button type="button" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors">
              <HiOutlinePlus className="w-5 h-5" />
              Create Intervention
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.map((intervention) => (
              <InterventionCard
                key={intervention.id}
                intervention={intervention}
                onDelete={handleDelete}
                onStatusUpdate={handleQuickStatusUpdate}
                onView={() => navigate(`/social-worker/interventions/${intervention.id}`)}
                onEdit={() => navigate(`/social-worker/interventions/${intervention.id}/edit`)}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            onPageChange={goToPage}
          />
        </>
      )}
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm border border-gray-100 ${color}`}>
      <Icon className="w-6 h-6 mb-2" />
      <div className="text-2xl font-extrabold mb-0.5">{value}</div>
      <div className="text-xs font-semibold opacity-80">{label}</div>
    </div>
  );
}

function InterventionCard({ intervention, onDelete, onStatusUpdate, onView, onEdit }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PLANNED': return 'bg-blue-50 border-blue-200';
      case 'SCHEDULED': return 'bg-amber-50 border-amber-200';
      case 'IN_PROGRESS': return 'bg-orange-50 border-orange-200';
      case 'COMPLETED': return 'bg-emerald-50 border-emerald-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'HOME_VISIT': return HiOutlineLocationMarker;
      case 'MEDICAL': return HiOutlineLightningBolt;
      case 'COUNSELING': return HiOutlineExclamation;
      default: return HiOutlineClipboardList;
    }
  };

  const TypeIcon = getTypeIcon(intervention.type);
  const caseId = intervention.caseId;
  const caseLabel = intervention.caseNumber || (caseId ? `Case #${caseId}` : null);

  const actionBtn =
    'inline-flex items-center justify-center p-2.5 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary';

  return (
    <div
      className={`rounded-2xl border-2 p-5 sm:p-6 shadow-md hover:shadow-lg transition-all duration-200 ${getStatusColor(intervention.status)}`}
    >
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                intervention.status === 'COMPLETED' ? 'bg-emerald-500' :
                intervention.status === 'IN_PROGRESS' ? 'bg-orange-500' :
                intervention.status === 'SCHEDULED' ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              >
                <TypeIcon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                  {intervention.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <StatusBadge status={intervention.status} size="sm" />
                  {intervention.priority && (
                    <PriorityBadge priority={intervention.priority} size="sm" />
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-teal-800 border border-teal-200">
                    <TypeIcon className="w-3.5 h-3.5" />
                    {formatEnum(intervention.type)}
                  </span>
                  {intervention.interventionCode && (
                    <span className="text-xs text-gray-500 font-mono">{intervention.interventionCode}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {intervention.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{intervention.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            {caseLabel && (
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineFolderOpen className="w-4 h-4 flex-shrink-0 text-gray-400" />
                {caseId ? (
                  <Link
                    to={`/social-worker/cases/${caseId}`}
                    className="font-medium text-primary hover:text-primary-700 hover:underline inline-flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {caseLabel}
                    <HiOutlineExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </Link>
                ) : (
                  <span>Case: {caseLabel}</span>
                )}
              </div>
            )}
            {intervention.caseBeneficiaryName && (
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineUser className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="truncate">{intervention.caseBeneficiaryName}</span>
              </div>
            )}
            {intervention.plannedStartDatetime && (
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineCalendar className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="truncate">{formatDate(intervention.plannedStartDatetime)}</span>
              </div>
            )}
            {intervention.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineLocationMarker className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="truncate">{intervention.location}</span>
              </div>
            )}
            {intervention.durationMinutes != null && (
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineClock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span>{intervention.durationMinutes} min</span>
              </div>
            )}
            {intervention.plannedBy?.fullName && (
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineUser className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="truncate">By: {intervention.plannedBy.fullName}</span>
              </div>
            )}
            {intervention.category && (
              <div className="flex items-center gap-2 text-gray-600">
                <HiOutlineClipboardList className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="truncate">{intervention.category}</span>
              </div>
            )}
          </div>

          {caseId && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                to={`/social-worker/cases/${caseId}/entries`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-white border-2 border-teal-200 text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-colors shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <HiOutlineBookOpen className="w-4 h-4" />
                Case entries
              </Link>
              <Link
                to={`/social-worker/cases/${caseId}`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-white border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary transition-colors shadow-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <HiOutlineFolderOpen className="w-4 h-4" />
                Open case
              </Link>
            </div>
          )}

          {intervention.status === 'COMPLETED' && intervention.effectivenessPercent != null && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                <span>Effectiveness</span>
                <span>{intervention.effectivenessPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    intervention.effectivenessPercent >= 80 ? 'bg-emerald-500' :
                    intervention.effectivenessPercent >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${intervention.effectivenessPercent}%` }}
                />
              </div>
            </div>
          )}

          {intervention.status !== 'COMPLETED' && (
            <div className="pt-2 border-t border-gray-200/60">
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Quick status</label>
              <select
                value={intervention.status}
                onChange={(e) => onStatusUpdate(intervention.id, e.target.value)}
                className="w-full max-w-xs px-3 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              >
                {Object.values(INTERVENTION_STATUSES).map((status) => (
                  <option key={status} value={status}>{formatEnum(status)}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1 italic">Syncs case, schedule, and field work</p>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Created {formatRelativeTime(intervention.createdAt)}
          </p>
        </div>

        {/* Actions — always enabled (aligned with My Cases pattern) */}
        <div
          className="flex flex-row lg:flex-col gap-2 justify-end lg:justify-start lg:border-l lg:border-t-0 border-t border-gray-200/60 pt-4 lg:pt-0 lg:pl-5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="View details"
            onClick={onView}
            className={`${actionBtn} border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400`}
          >
            <HiOutlineEye className="w-5 h-5" />
          </button>
          <button
            type="button"
            title="Edit intervention"
            onClick={onEdit}
            className={`${actionBtn} border-primary-200 text-primary hover:bg-primary-50 hover:border-primary-400`}
          >
            <HiOutlinePencil className="w-5 h-5" />
          </button>
          <button
            type="button"
            title="Delete intervention"
            onClick={() => onDelete(intervention.id)}
            className={`${actionBtn} border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400`}
          >
            <HiOutlineTrash className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
