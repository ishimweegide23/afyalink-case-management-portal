import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { caseApi } from '../../api/caseApi';
import { beneficiaryApi } from '../../api/beneficiaryApi';
import { interventionApi } from '../../api/interventionApi';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/shared/StatCard';
import Spinner from '../../components/common/Spinner';
import StatusBadge from '../../components/shared/StatusBadge';
import Button from '../../components/common/Button';
import { exportService } from '../../services/exportService';
import { USER_ROLES } from '../../utils/constants';
import { formatDate } from '../../utils/formatDate';
import {
  HiOutlineFolder,
  HiOutlineHeart,
  HiOutlineClipboardList,
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineChartBar,
  HiOutlineDownload,
  HiOutlineCalendar,
} from 'react-icons/hi';

const ROLE_REPORT_TITLES = {
  [USER_ROLES.ADMIN]: 'Reports & Analytics',
  [USER_ROLES.SUPERVISOR]: 'Team Reports',
};

const ROLE_REPORT_SUBTITLES = {
  [USER_ROLES.ADMIN]: 'System-wide reports for all supervisors and social workers. Select date range and export as CSV, Excel, or PDF.',
  [USER_ROLES.SUPERVISOR]: 'Reports from your team (social workers). Select date range and export data.',
};

export default function ReportsPage() {
  const { user } = useAuth();
  const role = user?.role;
  const [stats, setStats] = useState(null);
  const [casesByStatus, setCasesByStatus] = useState([]);
  const [reportCases, setReportCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [casesRes, benRes, intRes, usersRes, openRes, ipRes, closedRes, compIntRes, casesListRes] = await Promise.allSettled([
        caseApi.getAll({ page: 0, size: 1 }),
        beneficiaryApi.getAll({ page: 0, size: 1 }),
        interventionApi.getAll({ page: 0, size: 1 }),
        userApi.getAll({ page: 0, size: 1 }),
        caseApi.getByStatus('OPEN', { page: 0, size: 1 }),
        caseApi.getByStatus('IN_PROGRESS', { page: 0, size: 1 }),
        caseApi.getByStatus('CLOSED', { page: 0, size: 1 }),
        interventionApi.getByStatus('COMPLETED', { page: 0, size: 1 }),
        caseApi.getAll({ page: 0, size: 500, sortBy: 'createdAt', direction: 'DESC' }),
      ]);

      const extractTotal = (r) => (r.status === 'fulfilled' ? (r.value?.data?.totalElements ?? r.value?.totalElements ?? 0) : 0);
      const payload = (r) => r.status === 'fulfilled' ? (r.value?.data ?? r.value) : null;

      setStats({
        cases: extractTotal(casesRes),
        beneficiaries: extractTotal(benRes),
        interventions: extractTotal(intRes),
        users: extractTotal(usersRes),
        completedInterventions: extractTotal(compIntRes),
      });

      setCasesByStatus([
        { status: 'OPEN', count: extractTotal(openRes) },
        { status: 'IN_PROGRESS', count: extractTotal(ipRes) },
        { status: 'CLOSED', count: extractTotal(closedRes) },
      ]);

      const casesPayload = payload(casesListRes);
      const list = Array.isArray(casesPayload?.content) ? casesPayload.content : [];
      setReportCases(list);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  const filterByDate = (list) => {
    if (!dateFrom && !dateTo) return list;
    return list.filter((item) => {
      const d = item.createdAt || item.updatedAt;
      if (!d) return true;
      const date = new Date(d);
      if (dateFrom && date < new Date(dateFrom + 'T00:00:00')) return false;
      if (dateTo && date > new Date(dateTo + 'T23:59:59')) return false;
      return true;
    });
  };

  const filteredCases = filterByDate(reportCases);

  const exportCsv = () => {
    const rows = filteredCases.map((c) => ({
      CaseNumber: c.caseNumber || '',
      Title: c.title || '',
      Beneficiary: c.beneficiaryName || '',
      Status: c.status || '',
      Priority: c.priority || '',
      AssignedTo: c.assignedSocialWorker?.fullName || c.assignedSocialWorker?.email || '',
      CreatedAt: c.createdAt ? formatDate(c.createdAt) : '',
      UpdatedAt: c.updatedAt ? formatDate(c.updatedAt) : '',
    }));
    if (!rows.length) {
      toast.info('No data to export for the selected date range.');
      return;
    }
    const name = `cases-report-${dateFrom || 'all'}-${dateTo || 'all'}.csv`;
    exportService.downloadCsv(rows, name);
    toast.success('CSV downloaded');
  };

  const exportExcel = () => {
    const rows = filteredCases.map((c) => ({
      CaseNumber: c.caseNumber || '',
      Title: c.title || '',
      Beneficiary: c.beneficiaryName || '',
      Status: c.status || '',
      Priority: c.priority || '',
      AssignedTo: c.assignedSocialWorker?.fullName || c.assignedSocialWorker?.email || '',
      CreatedAt: c.createdAt ? formatDate(c.createdAt) : '',
      UpdatedAt: c.updatedAt ? formatDate(c.updatedAt) : '',
    }));
    if (!rows.length) {
      toast.info('No data to export for the selected date range.');
      return;
    }
    const name = `cases-report-${dateFrom || 'all'}-${dateTo || 'all'}.xls`;
    exportService.downloadCsv(rows, name);
    toast.success('Excel file downloaded (open with Excel)');
  };

  const exportPdf = () => {
    const printContent = document.getElementById('report-table-print');
    if (!printContent) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Cases Report</title>
      <style>table{border-collapse:collapse;width:100%;} th,td{border:1px solid #ddd;padding:8px;text-align:left;} th{background:#0369A1;color:#fff;}</style>
      </head><body><h2>Cases Report</h2><p>From ${dateFrom || 'all'} to ${dateTo || 'all'}</p>${printContent.innerHTML}</body></html>
    `);
    w.document.close();
    w.print();
    w.close();
    toast.success('Print/PDF dialog opened');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gray-100/80 bg-white shadow-lg shadow-gray-200/50">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
        <div className="relative bg-gradient-to-r from-slate-50/80 to-white px-6 py-6 border-b border-gray-100">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-3 shadow-sm border border-primary/10">
            <HiOutlineChartBar className="w-4 h-4" />
            {ROLE_REPORT_TITLES[role] || 'Reports'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{ROLE_REPORT_TITLES[role] || 'Reports & Analytics'}</h1>
          <p className="text-gray-500 mt-1 text-sm">{ROLE_REPORT_SUBTITLES[role] || 'System overview and statistics'}</p>
        </div>

        <div className="p-6 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard title="Total Cases" value={stats?.cases} icon={HiOutlineFolder} color="primary" />
            <StatCard title="Beneficiaries" value={stats?.beneficiaries} icon={HiOutlineHeart} color="danger" />
            <StatCard title="Interventions" value={stats?.interventions} icon={HiOutlineClipboardList} color="info" />
            <StatCard title="Completed Int." value={stats?.completedInterventions} icon={HiOutlineCheckCircle} color="secondary" />
            <StatCard title="Active Users" value={stats?.users} icon={HiOutlineUsers} color="purple" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 flex-wrap">
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={exportCsv} icon={HiOutlineDownload}>Export CSV</Button>
              <Button size="sm" variant="outline" onClick={exportExcel} icon={HiOutlineDownload}>Export Excel</Button>
              <Button size="sm" variant="outline" onClick={exportPdf} icon={HiOutlineDownload}>Export / Print PDF</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Cases by Status</h3>
              <div className="space-y-4">
                {casesByStatus.map((item) => {
                  const total = stats?.cases || 1;
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <StatusBadge status={item.status} />
                        <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            item.status === 'OPEN' ? 'bg-blue-500' :
                            item.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'Total cases in system', value: stats?.cases, icon: HiOutlineFolder, color: 'text-blue-500 bg-blue-50' },
                  { label: 'Registered beneficiaries', value: stats?.beneficiaries, icon: HiOutlineHeart, color: 'text-pink-500 bg-pink-50' },
                  { label: 'Total interventions', value: stats?.interventions, icon: HiOutlineClipboardList, color: 'text-cyan-500 bg-cyan-50' },
                  { label: 'Active system users', value: stats?.users, icon: HiOutlineUsers, color: 'text-purple-500 bg-purple-50' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-lg font-bold text-gray-900">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 p-4 border-b border-gray-100 flex items-center gap-2">
              <HiOutlineCalendar className="w-4 h-4 text-primary" />
              Cases report table {dateFrom || dateTo ? `(${dateFrom || '…'} to ${dateTo || '…'})` : '(all dates)'}
            </h3>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm" id="report-table-print">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Case #</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Beneficiary</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCases.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No cases in selected date range</td></tr>
                  ) : (
                    filteredCases.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-gray-700">{c.caseNumber || '—'}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{c.title || '—'}</td>
                        <td className="px-4 py-3 text-gray-700">{c.beneficiaryName || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-gray-700">{c.assignedSocialWorker?.fullName || c.assignedSocialWorker?.email || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{c.createdAt ? formatDate(c.createdAt) : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 px-4 py-2 border-t border-gray-100">{filteredCases.length} row(s)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
