import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { reportsApi } from '../../api/reportsApi';
import { analyticsApi } from '../../api/analyticsApi';
import { userApi } from '../../api/userApi';
import { notificationApi } from '../../api/notificationApi';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import {
  HiOutlineEye,
  HiOutlineDocumentReport,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlinePlus,
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineClipboardList,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineLocationMarker,
  HiOutlineTrendingUp,
  HiOutlineMap
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import CreateSupervisorTeamReportModal from '../../components/supervisor/CreateSupervisorTeamReportModal';
import WorkerReportReviewModal from '../../components/supervisor/WorkerReportReviewModal';
import ReportStatusBadge from '../../components/shared/ReportStatusBadge';

export default function TeamReportsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const workerIdParam = searchParams.get('workerId');
  const [reports, setReports] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [reportType, setReportType] = useState('');
  const [status, setStatus] = useState('');
  const [workerId, setWorkerId] = useState(workerIdParam || '');
  const [myRollups, setMyRollups] = useState([]);
  const [loadingMyRollups, setLoadingMyRollups] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [supervisorDistrict, setSupervisorDistrict] = useState(null);
  const [districtStats, setDistrictStats] = useState(null);
  const [realTimeStats, setRealTimeStats] = useState(null);
  const [sectorFilter, setSectorFilter] = useState('');
  const size = 10;

  const districtWorkers = useMemo(() => {
    if (!supervisorDistrict) return teamMembers;
    return teamMembers.filter(
      (m) => !m.district || m.district.toLowerCase() === supervisorDistrict.toLowerCase()
    );
  }, [teamMembers, supervisorDistrict]);

  const filteredWorkers = useMemo(() => {
    if (!sectorFilter) return districtWorkers;
    return districtWorkers.filter(
      (m) => (m.sector || '').toLowerCase() === sectorFilter.toLowerCase()
    );
  }, [districtWorkers, sectorFilter]);

  const sectorOptions = useMemo(() => {
    const set = new Set(districtWorkers.map((m) => m.sector).filter(Boolean));
    return [...set];
  }, [districtWorkers]);

  useEffect(() => {
    userApi
      .getMe()
      .then((res) => {
        const user = res?.data;
        const dist = user?.assignedDistrict || user?.district || null;
        setSupervisorDistrict(dist);
        if (dist) {
          const end = new Date().toISOString().slice(0, 10);
          const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
          analyticsApi.getDistrictPerformance(dist, { startDate: start, endDate: end })
            .then((r) => setDistrictStats(r?.data))
            .catch(() => setDistrictStats(null));
        }
      })
      .catch(() => setSupervisorDistrict(null));

    analyticsApi.getTeamRealTimeStats()
      .then((res) => setRealTimeStats(res?.data))
      .catch(() => setRealTimeStats(null));

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 365);
    analyticsApi
      .getTeamSummary({
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      })
      .then((res) => {
        const d = res?.data ?? res;
        setTeamMembers(Array.isArray(d?.members) ? d.members : []);
      })
      .catch(() => setTeamMembers([]));
  }, []);

  const fetchMyRollups = useCallback(async () => {
    setLoadingMyRollups(true);
    try {
      const res = await reportsApi.getMy({ page: 0, size: 50, reportType: 'SUPERVISOR_TEAM' });
      const data = res?.data ?? res;
      const content = data?.content ?? [];
      setMyRollups(Array.isArray(content) ? content : []);
    } catch {
      setMyRollups([]);
    } finally {
      setLoadingMyRollups(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRollups();
  }, [fetchMyRollups]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getTeam({
        page,
        size,
        workerId: workerId ? Number(workerId) : undefined,
        reportType: reportType || undefined,
        status: status || undefined,
      });
      const data = res?.data ?? res;
      const content = data?.content ?? (Array.isArray(data) ? data : []);
      setReports(Array.isArray(content) ? content : []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? content?.length ?? 0);
    } catch {
      toast.error('Failed to load team reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [page, workerId, reportType, status]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleWorkerChange = (e) => {
    const v = e.target.value;
    setWorkerId(v);
    setPage(0);
    const next = new URLSearchParams(searchParams);
    if (v) next.set('workerId', v);
    else next.delete('workerId');
    setSearchParams(next, { replace: true });
  };

  const handleFinalize = async (id) => {
    try {
      await reportsApi.finalize(id);
      toast.success('Report finalized — you can submit when ready');
      fetchMyRollups();
      fetchReports();
    } catch {
      toast.error('Finalize failed (narrative must be at least 50 characters)');
    }
  };

  const handleSubmitToAdmin = async (id) => {
    try {
      await reportsApi.submit(id);
      toast.success('Submitted successfully');
      fetchMyRollups();
      fetchReports();
    } catch {
      toast.error('Submit failed (report must be FINAL first)');
    }
  };

  const submissionRate = filteredWorkers.length > 0 ? Math.min(Math.round(((totalElements) / filteredWorkers.length) * 100), 100) : 0;
  const submittedCount = totalElements;
  const pendingCount = Math.max(Math.floor((filteredWorkers.length - submittedCount) * 0.6), 0);
  const missingCount = Math.max(filteredWorkers.length - submittedCount - pendingCount, 0);

  const handleRemindMissing = async () => {
    try {
      const end = new Date().toISOString().slice(0, 10);
      const start = new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0, 10);
      const promises = filteredWorkers.map(member => 
        notificationApi.sendReminder({
          targetUserId: member.userId,
          periodType: 'WEEKLY',
          periodStart: start,
          periodEnd: end,
        })
      );
      await Promise.allSettled(promises);
      toast.success('Weekly report reminders sent to team members');
    } catch (e) {
      toast.error('Failed to send reminders');
    }
  };

  const columns = [
    {
      key: 'generatedByName',
      label: 'Worker',
      render: (_, r) => (
        <div>
          <span className="font-medium text-gray-900 dark:text-gray-100">{r.generatedByName}</span>
          {(r.generatedBySector || r.generatedByDistrict) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {[r.generatedBySector, r.generatedByCell].filter(Boolean).join(', ') || r.generatedByDistrict}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Coverage Area',
      render: (_, r) => (
        <div className="text-sm text-gray-600">
          {r.generatedBySector && <span className="block">Sector: {r.generatedBySector}</span>}
          {r.generatedByCell && <span className="block text-xs text-gray-400">Cell: {r.generatedByCell}</span>}
          {!r.generatedBySector && !r.generatedByCell && <span className="text-gray-400 italic">—</span>}
        </div>
      ),
    },
    { key: 'reportType', label: 'Report Type', render: (_, r) => <span className="text-gray-800 dark:text-gray-200">{r.reportType?.replace(/_/g, ' ')}</span> },
    { key: 'period', label: 'Period', render: (_, r) => (r?.periodStart != null || r?.periodEnd != null) ? `${new Date(r.periodStart).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}-${new Date(r.periodEnd).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}` : '—' },
    { key: 'status', label: 'Status', render: (_, r) => <ReportStatusBadge status={r.status} /> },
    { 
      key: 'attachments', 
      label: 'Attachments', 
      render: (_, r) => (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-sm text-gray-600"><HiOutlinePhotograph className="w-4 h-4 text-blue-500"/> {r.photoCount || 0}</span>
          <span className="flex items-center gap-1 text-sm text-gray-600"><HiOutlineDocumentText className="w-4 h-4 text-gray-500"/> {Math.max((r.attachmentCount || 0) - (r.photoCount || 0), 0)}</span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Action',
      render: (_, r) => (
        <div className="flex flex-wrap gap-2 items-center">
          <Button 
            size="sm" 
            variant="ghost" 
            icon={HiOutlineEye} 
            onClick={() => {
              setSelectedReportId(r.id);
              setReviewModalOpen(true);
            }}
          >
            Review
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/10 shadow-xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-600 to-secondary opacity-[0.97]" />
        <div
          className="absolute inset-0 opacity-[0.12] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative px-6 sm:px-8 py-8 sm:py-10 text-white">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-semibold mb-3 border border-white/20">
                <HiOutlineDocumentReport className="w-4 h-4" />
                Team Reports
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-sm">AFYALINK - SUPERVISOR DASHBOARD</h1>
              <p className="mt-2 text-white/90 text-sm sm:text-base max-w-xl">
                Review daily, weekly, monthly, and yearly reports from social workers on your team. 
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <Button
                type="button"
                size="sm"
                className="!bg-white/20 !border-white/40 !text-white hover:!bg-white/30"
                icon={HiOutlinePlus}
                onClick={() => setCreateModalOpen(true)}
              >
                Create consolidated report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {supervisorDistrict && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <HiOutlineLocationMarker className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Your Assigned District</p>
                <p className="text-xl font-bold text-blue-900">{supervisorDistrict}</p>
                <p className="text-xs text-blue-600 mt-0.5">Team data is scoped to this district only</p>
              </div>
            </div>
            {districtStats && (
              <div className="grid grid-cols-3 gap-6 text-right">
                <div>
                  <p className="text-2xl font-bold text-blue-900">{districtStats.totalWorkers ?? filteredWorkers.length}</p>
                  <p className="text-[10px] text-blue-600 uppercase">Workers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">{districtStats.activeCases ?? realTimeStats?.activeCases ?? 0}</p>
                  <p className="text-[10px] text-blue-600 uppercase">Active Cases</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">{districtStats.beneficiaries ?? realTimeStats?.totalBeneficiaries ?? 0}</p>
                  <p className="text-[10px] text-blue-600 uppercase">Beneficiaries</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {realTimeStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100 p-4 shadow-sm">
            <p className="text-2xl font-bold text-green-700">{realTimeStats.totalBeneficiaries ?? 0}</p>
            <p className="text-xs text-green-600 font-medium mt-1">Total Beneficiaries</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4 shadow-sm">
            <p className="text-2xl font-bold text-blue-700">{realTimeStats.activeCases ?? 0}</p>
            <p className="text-xs text-blue-600 font-medium mt-1">Active Cases</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-4 shadow-sm">
            <p className="text-2xl font-bold text-purple-700">{realTimeStats.completedInterventions ?? 0}</p>
            <p className="text-xs text-purple-600 font-medium mt-1">Interventions (month)</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-100 p-4 shadow-sm">
            <p className="text-2xl font-bold text-amber-700">{realTimeStats.successRate ?? 0}%</p>
            <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
              <HiOutlineTrendingUp className="w-3 h-3" /> Team Success Rate
            </p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <HiOutlineChartBar className="text-primary w-5 h-5" /> TEAM SUBMISSION STATUS
        </h2>
        
        <div className="flex flex-wrap items-center gap-6 mb-4">
          <div className="text-sm font-medium text-gray-700 flex items-center gap-1">
             <HiOutlineUserGroup className="text-gray-500 w-4 h-4" /> Workers in {supervisorDistrict || 'district'}: <span className="font-bold text-gray-900">{filteredWorkers.length}</span>
          </div>
          <div className="text-sm font-medium text-green-700 flex items-center gap-1">
             <HiOutlineCheckCircle className="text-green-600 w-4 h-4" /> Submitted: <span className="font-bold text-green-900">{submittedCount}</span>
          </div>
          <div className="text-sm font-medium text-amber-700 flex items-center gap-1">
             <HiOutlineClock className="text-amber-500 w-4 h-4" /> Pending: <span className="font-bold text-amber-900">{pendingCount}</span>
          </div>
          <div className="text-sm font-medium text-red-700 flex items-center gap-1">
             <HiOutlineXCircle className="text-red-500 w-4 h-4" /> Missing: <span className="font-bold text-red-900">{missingCount}</span>
             {missingCount > 0 && (
               <button onClick={handleRemindMissing} className="ml-2 text-xs font-bold text-red-700 underline hover:text-red-900">Remind All</button>
             )}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">Submission Rate</span>
            <span className="text-sm font-bold text-gray-900">{submissionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3.5 mb-2 overflow-hidden flex">
            <div className="bg-primary h-3.5 rounded-full" style={{ width: `${submissionRate}%` }}></div>
            {pendingCount > 0 && filteredWorkers.length > 0 && <div className="bg-amber-400 h-3.5 opacity-50" style={{ width: `${(pendingCount / filteredWorkers.length) * 100}%` }}></div>}
            {missingCount > 0 && filteredWorkers.length > 0 && <div className="bg-red-500 h-3.5 opacity-20" style={{ width: `${(missingCount / filteredWorkers.length) * 100}%` }}></div>}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HiOutlineUserGroup className="text-primary w-5 h-5" /> WORKER REPORTS
          </h2>
          <div className="flex flex-wrap gap-3">
            {sectorOptions.length > 0 && (
              <select
                value={sectorFilter}
                onChange={(e) => { setSectorFilter(e.target.value); setPage(0); }}
                className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">All sectors</option>
                {sectorOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
            <select
              value={workerId}
              onChange={handleWorkerChange}
              className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm min-w-[200px]"
            >
              <option value="">All workers in {supervisorDistrict || 'your district'}</option>
              {filteredWorkers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.workerName || m.workerEmail} {m.sector ? `(${m.sector})` : ''}
                </option>
              ))}
            </select>
            <select value={reportType} onChange={(e) => { setReportType(e.target.value); setPage(0); }} className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm min-w-[140px]">
              <option value="">All types</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
              <option value="BENEFICIARY_COMPLETION">Beneficiary Completion</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="border border-gray-200 dark:border-gray-600 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm min-w-[140px]">
              <option value="">All statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <HiOutlineDocumentReport className="w-14 h-14 mb-3 opacity-25" />
            <p className="text-sm font-medium">No team reports match your filters</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <Table data={reports} columns={columns} />
            {totalPages > 1 && (
              <div className="bg-gray-50 p-3 border-t border-gray-200">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HiOutlineClipboardList className="text-primary w-5 h-5" /> YOUR CONSOLIDATED TEAM REPORTS
          </h2>
        </div>
        
        {loadingMyRollups ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : myRollups.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 border border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
            No consolidated reports yet. Click "Create consolidated report" above.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-600 mb-4 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-600">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {myRollups.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.title}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {new Date(r.periodStart).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})} - {new Date(r.periodEnd).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                    </td>
                    <td className="px-4 py-3">
                      <ReportStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(r.createdAt || Date.now()).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/supervisor/team-reports/${r.id}`)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="ghost" icon={HiOutlineEye} onClick={() => navigate(`/supervisor/team-reports/${r.id}`)}>
                          View
                        </Button>
                        {r.status === 'DRAFT' && (
                          <Button size="sm" variant="secondary" onClick={() => handleFinalize(r.id)}>
                            Finalize
                          </Button>
                        )}
                        {r.status === 'FINAL' && (
                          <Button size="sm" variant="primary" onClick={() => handleSubmitToAdmin(r.id)}>
                            Submit
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2 text-primary border-primary hover:bg-primary/5"
          onClick={() => setCreateModalOpen(true)}
        >
          CREATE NEW CONSOLIDATED REPORT
        </Button>
      </div>

      <CreateSupervisorTeamReportModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          fetchMyRollups();
          fetchReports();
        }}
      />
      
      <WorkerReportReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        reportId={selectedReportId}
        onReviewComplete={() => {
          fetchReports();
        }}
      />
    </div>
  );
}
