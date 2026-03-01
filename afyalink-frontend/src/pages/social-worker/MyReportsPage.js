import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/reportsApi';
import { ROUTES } from '../../routes/routeConstants';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import ExportButtons from '../../components/shared/ExportButtons';
import ReportStatusBadge from '../../components/shared/ReportStatusBadge';
import {
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineDocumentReport,
  HiOutlineChartBar,
  HiOutlineCalendar,
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineChevronRight,
  HiOutlineSearch,
  HiOutlineFilter,
} from 'react-icons/hi';
import { toast } from 'react-toastify';

const REPORT_TYPE_COLOR = { 
  DAILY: 'blue', 
  WEEKLY: 'green', 
  MONTHLY: 'blue', 
  YEARLY: 'orange', 
  BENEFICIARY_COMPLETION: 'green', 
  CUSTOM: 'gray' 
};

export default function MyReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  // Social Worker ONLY filters - No team/organization options
  const [filters, setFilters] = useState({ 
    type: '',      // DAILY, WEEKLY, MONTHLY, YEARLY
    status: '',    // DRAFT, FINAL, SUBMITTED
    search: ''     // Search by title
  });
  
  const size = 10;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await reportsApi.getMy({ 
        page, 
        size, 
        reportType: filters.type || undefined, 
        status: filters.status || undefined 
      });
      const data = res?.data ?? res;
      const content = data?.content ?? data?.data ?? (Array.isArray(data) ? data : []);
      setReports(Array.isArray(content) ? content : []);
      setTotalPages(data?.totalPages ?? 0);
      setTotalElements(data?.totalElements ?? content?.length ?? 0);
    } catch {
      toast.error('Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    setPage(0);
  }, [filters.type, filters.status]);

  useEffect(() => { 
    fetchReports(); 
  }, [page, filters.type, filters.status]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this draft report?')) return;
    try {
      await reportsApi.delete(id);
      toast.success('Report deleted');
      fetchReports();
    } catch (e) {
      toast.error(e?.message || 'Delete failed');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Filter counts for badges
  const getFilterCount = () => {
    let count = 0;
    if (filters.type) count++;
    if (filters.status) count++;
    return count;
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Section - YOUR ORIGINAL 3-COLOR GRADIENT */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl">
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
                My Reports
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-sm">Activity Reports</h1>
              <p className="mt-2 text-white/90 text-sm sm:text-base max-w-xl">
                Create and manage your daily, weekly, monthly, or yearly activity reports.
                Add photos and documents as evidence of your field work.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur border border-white/20">
                <HiOutlineChartBar className="w-8 h-8 text-white/90" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">Total Reports</p>
                  <p className="text-xl font-bold">{totalElements}</p>
                </div>
              </div>
              <Button
                variant="header"
                icon={HiOutlinePlus}
                onClick={() => navigate(ROUTES.SOCIAL_WORKER.MY_REPORTS_CREATE)}
              >
                Create Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section - SOCIAL WORKER ONLY (No team/organization filters) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors sm:hidden"
          >
            <HiOutlineFilter className="w-4 h-4" />
            Filters {getFilterCount() > 0 && `(${getFilterCount()})`}
            <HiOutlineChevronRight className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </button>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </form>

          {/* Filter Dropdowns - Visible on desktop or when toggled on mobile */}
          <div className={`flex flex-wrap gap-3 ${showFilters ? 'flex mt-3 sm:mt-0' : 'hidden sm:flex'}`}>
            {/* Report Type Filter - Only report types, no team options */}
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 0 })}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              <option value="">All Types</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
              <option value="BENEFICIARY_COMPLETION">Beneficiary Completion</option>
              <option value="CUSTOM">Custom</option>
            </select>

            {/* Status Filter - Only report statuses */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 0 })}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="FINAL">Final</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            {/* Clear Filters Button */}
            {(filters.type || filters.status || filters.search) && (
              <button
                onClick={() => setFilters({ type: '', status: '', search: '' })}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <HiOutlineDocumentReport className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No reports found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filters.type || filters.status || filters.search
                ? "Try changing your filters to see more reports"
                : "Create your first report by clicking the 'Create Report' button above"}
            </p>
            {!filters.type && !filters.status && !filters.search && (
              <Button 
                variant="primary" 
                icon={HiOutlinePlus} 
                onClick={() => navigate(ROUTES.SOCIAL_WORKER.MY_REPORTS_CREATE)}
                className="mt-4"
              >
                Create Your First Report
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Report Cards */}
            <div className="divide-y divide-gray-100">
              {reports.map((report) => (
                <div key={report.id} className="p-5 hover:bg-gray-50/50 transition-all duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Section - Report Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge color={REPORT_TYPE_COLOR[report.reportType] || 'gray'} size="sm">
                          {report.reportType?.replace(/_/g, ' ')}
                        </Badge>
                        <ReportStatusBadge status={report.status} size="sm" />
                        {report.photoCount > 0 && (
                          <Badge color="blue" size="sm" icon={HiOutlinePhotograph}>
                            {report.photoCount} photo{report.photoCount !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {report.attachmentCount > (report.photoCount || 0) && (
                          <Badge color="gray" size="sm" icon={HiOutlineDocumentText}>
                            {report.attachmentCount - (report.photoCount || 0)} doc{report.attachmentCount - (report.photoCount || 0) !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
                        {report.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
                        <span className="flex items-center gap-1">
                          <HiOutlineCalendar className="w-3.5 h-3.5" />
                          {report.periodStart} – {report.periodEnd}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span>Created {getRelativeTime(report.createdAt)}</span>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        icon={HiOutlineEye} 
                        onClick={() => navigate(`/social-worker/my-reports/${report.id}`)}
                        className="text-gray-600 hover:text-primary"
                      >
                        View
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        icon={HiOutlinePencil} 
                        onClick={() => navigate(`${ROUTES.SOCIAL_WORKER.MY_REPORTS_CREATE}?edit=${report.id}`)}
                        className="text-gray-600 hover:text-primary"
                      >
                        Edit
                      </Button>
                      
                      {report.status === 'DRAFT' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          icon={HiOutlineTrash} 
                          onClick={() => handleDelete(report.id)}
                          className="text-gray-400 hover:text-red-600"
                        />
                      )}
                      
                      <div className="flex gap-2">
                        <ExportButtons 
                          reportId={report.id} 
                          reportTitle={report.title}
                          reportType={report.reportType}
                          periodStart={report.periodStart}
                        />
                        <HiOutlineChevronRight className="w-5 h-5 text-gray-300 lg:hidden" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-100 px-5 py-4">
                <Pagination 
                  currentPage={page} 
                  totalPages={totalPages} 
                  onPageChange={setPage} 
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}