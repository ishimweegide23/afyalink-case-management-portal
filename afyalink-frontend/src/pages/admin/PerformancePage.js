import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { performanceApi } from '../../api/performanceApi';
import SendWarningModal from '../../components/performance/SendWarningModal';
import ReassignSocialWorkerModal from '../../components/performance/ReassignSocialWorkerModal';
import SendComplimentModal from '../../components/performance/SendComplimentModal';
import SupervisorWorkloadCard from '../../components/performance/SupervisorWorkloadCard';
import PerformanceDetailsModal from '../../components/performance/PerformanceDetailsModal';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import Avatar from '../../components/shared/Avatar';
import PageHeader from '../../components/layout/PageHeader';
import {
  HiOutlineChartSquareBar,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlineExclamation,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineRefresh,
  HiOutlineSwitchHorizontal,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineThumbUp,
} from 'react-icons/hi';

export default function PerformancePage() {
  const [tab, setTab] = useState('supervisor');
  const [timeRange, setTimeRange] = useState('week');
  const [performanceData, setPerformanceData] = useState([]);
  const [supervisorWorkload, setSupervisorWorkload] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [warningModal, setWarningModal] = useState({ open: false, user: null, suggestedReasons: [] });
  const [reassignModal, setReassignModal] = useState({ open: false, socialWorker: null });
  const [complimentModal, setComplimentModal] = useState({ open: false, user: null, suggestedAchievements: [] });
  const [detailsModal, setDetailsModal] = useState({ open: false, user: null });

  const fetchPerformanceData = useCallback(async () => {
    setLoading(true);
    try {
      const role = tab === 'supervisor' ? 'SUPERVISOR' : 'SOCIAL_WORKER';
      const [perfRes, workloadRes] = await Promise.all([
        performanceApi.getPerformanceMetrics(role, timeRange),
        performanceApi.getSupervisorWorkload(),
      ]);
      setPerformanceData(perfRes?.data ?? []);
      setSupervisorWorkload(workloadRes?.data ?? []);
    } catch (error) {
      toast.error('Failed to load performance data');
      setPerformanceData([]);
    } finally {
      setLoading(false);
    }
  }, [tab, timeRange]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  const handleSendWarning = (user) => {
    const reasons = [];
    const m = user.metrics || {};
    if (m.reportSubmissionRate < 70) reasons.push('Low report submission rate');
    if (m.caseCompletionRate < 60) reasons.push('Low case completion rate');
    if (m.avgResponseTimeHours > 48) reasons.push('Slow response time');
    if (m.interventionSuccessRate < 70) reasons.push('Low intervention success rate');
    if (m.overdueTasks > 3) reasons.push(`${m.overdueTasks} overdue tasks`);
    setWarningModal({ open: true, user, suggestedReasons: reasons });
  };

  const handleReassignSocialWorker = (socialWorker) => {
    setReassignModal({ open: true, socialWorker });
  };

  const handleSendCompliment = (user) => {
    const achievements = [];
    const m = user.metrics || {};
    if (m.caseCompletionRate >= 100) achievements.push('100% case completion');
    if (m.reportSubmissionRate >= 100) achievements.push('100% report submission on time');
    if (m.interventionSuccessRate >= 90) achievements.push('Excellent intervention success rate');
    if (m.overdueTasks === 0) achievements.push('Zero overdue tasks');
    setComplimentModal({ open: true, user, suggestedAchievements: achievements });
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const getPerformanceIcon = (score) => {
    if (score >= 80) return HiOutlineTrendingUp;
    return HiOutlineTrendingDown;
  };

  const filteredData = search.trim()
    ? performanceData.filter((u) =>
        (u.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
      )
    : performanceData;

  const roleFilter = tab === 'supervisor' ? 'SUPERVISOR' : 'SOCIAL_WORKER';
  const displayData = filteredData.filter((u) => u.role === roleFilter);

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Performance"
        badgeIcon={HiOutlineChartSquareBar}
        title="Performance Monitoring"
        subtitle="Track team performance, send warnings, and optimize workload distribution"
      />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <HiOutlineClock className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">Time Range:</span>
            <div className="flex rounded-lg bg-gray-100 p-1">
              {['week', 'month', 'quarter'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range ? 'bg-white text-primary shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range === 'week' ? 'Last 7 Days' : range === 'month' ? 'Last 30 Days' : 'Last 90 Days'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchPerformanceData} icon={HiOutlineRefresh}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setTab('supervisor')}
          className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all ${
            tab === 'supervisor' ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${tab === 'supervisor' ? 'bg-primary' : 'bg-gray-100'}`}>
            <HiOutlineUserGroup className={`w-7 h-7 ${tab === 'supervisor' ? 'text-white' : 'text-gray-500'}`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-500">Supervisor Performance</p>
            <p className="text-2xl font-bold text-gray-900">{performanceData.filter((u) => u.role === 'SUPERVISOR').length}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setTab('worker')}
          className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all ${
            tab === 'worker' ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${tab === 'worker' ? 'bg-primary' : 'bg-gray-100'}`}>
            <HiOutlineUsers className={`w-7 h-7 ${tab === 'worker' ? 'text-white' : 'text-gray-500'}`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-500">Social Worker Performance</p>
            <p className="text-2xl font-bold text-gray-900">{performanceData.filter((u) => u.role === 'SOCIAL_WORKER').length}</p>
          </div>
        </button>
      </div>

      {tab === 'supervisor' && supervisorWorkload.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Supervisor Workload Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supervisorWorkload.map((sup) => (
              <SupervisorWorkloadCard key={sup.id} supervisor={sup} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            {tab === 'supervisor' ? 'Supervisor' : 'Social Worker'} Performance Metrics
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing {displayData.length} of {performanceData.length}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : displayData.length === 0 ? (
          <div className="py-16 text-center">
            <HiOutlineUsers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No performance data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">User</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Score</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Cases</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Reports</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Interventions</th>
                  {tab === 'supervisor' && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase">Team</th>}
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayData.map((user) => {
                  const score = user.metrics?.overallScore ?? 0;
                  const Icon = getPerformanceIcon(score);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={user.fullName} size="md" />
                          <div>
                            <p className="font-semibold text-gray-900">{user.fullName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl font-bold ${getPerformanceColor(score)}`}>
                          <Icon className="w-5 h-5" />
                          {score}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-bold">{user.metrics?.casesCompleted ?? 0} / {user.metrics?.casesAssigned ?? 0}</p>
                        <p className="text-xs text-gray-500">{user.metrics?.caseCompletionRate ?? 0}% rate</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-bold">{user.metrics?.reportsSubmitted ?? 0} / {user.metrics?.reportsExpected ?? 0}</p>
                        <p className="text-xs text-gray-500">{user.metrics?.reportSubmissionRate ?? 0}% on time</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="font-bold">{user.metrics?.interventionsCompleted ?? 0}</p>
                        <p className="text-xs text-gray-500">{user.metrics?.interventionSuccessRate ?? 0}% success</p>
                      </td>
                      {tab === 'supervisor' && (
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold text-sm">
                            <HiOutlineUsers className="w-4 h-4" />
                            {user.metrics?.teamSize ?? 0}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" icon={HiOutlineEye} onClick={() => setDetailsModal({ open: true, user })}>
                            Details
                          </Button>
                          {score >= 80 ? (
                            <Button size="sm" variant="outline" icon={HiOutlineThumbUp} onClick={() => handleSendCompliment(user)}>
                              Compliment
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" icon={HiOutlineExclamation} onClick={() => handleSendWarning(user)}>
                              Warning
                            </Button>
                          )}
                          {tab === 'worker' && (
                            <Button size="sm" variant="outline" icon={HiOutlineSwitchHorizontal} onClick={() => handleReassignSocialWorker(user)}>
                              Reassign
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SendWarningModal
        isOpen={warningModal.open}
        onClose={() => setWarningModal({ open: false, user: null, suggestedReasons: [] })}
        user={warningModal.user}
        suggestedReasons={warningModal.suggestedReasons}
        onSuccess={fetchPerformanceData}
      />

      <ReassignSocialWorkerModal
        isOpen={reassignModal.open}
        onClose={() => setReassignModal({ open: false, socialWorker: null })}
        socialWorker={reassignModal.socialWorker}
        supervisors={supervisorWorkload}
        onSuccess={fetchPerformanceData}
      />

      <SendComplimentModal
        isOpen={complimentModal.open}
        onClose={() => setComplimentModal({ open: false, user: null, suggestedAchievements: [] })}
        user={complimentModal.user}
        suggestedAchievements={complimentModal.suggestedAchievements || []}
        onSuccess={fetchPerformanceData}
      />

      <PerformanceDetailsModal
        isOpen={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, user: null })}
        user={detailsModal.user}
        timeRange={timeRange}
      />
    </div>
  );
}
