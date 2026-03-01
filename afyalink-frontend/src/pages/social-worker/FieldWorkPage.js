import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { interventionApi } from '../../api/interventionApi';
import { documentApi } from '../../api/documentApi';
import { usePagination } from '../../hooks/usePagination';
import { useSearch } from '../../hooks/useSearch';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/layout/PageHeader';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/shared/StatusBadge';
import { formatDateTime, isToday } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';
import { INTERVENTION_STATUSES } from '../../utils/constants';
import {
  HiOutlineEye,
  HiOutlineMap,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineCheck,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiX
} from 'react-icons/hi';

const FIELD_ACTIVITY_TYPES = ['HOME_VISIT', 'MEDICAL', 'COUNSELING', 'EDUCATION', 'TRAINING', 'EMERGENCY'];

function isFieldType(type) {
  return type && FIELD_ACTIVITY_TYPES.includes(type);
}

// Custom Modal for Reporting Visit Outcome
function ReportModal({ isOpen, onClose, onSubmit, item }) {
  const [effectiveness, setEffectiveness] = useState(85);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEffectiveness(85);
      setNotes('');
      setFile(null);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(item, effectiveness, notes, file);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Report Visit Outcome</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <HiX className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effectiveness Rating: {effectiveness}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={effectiveness}
              onChange={(e) => setEffectiveness(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0% (Poor)</span>
              <span>100% (Excellent)</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Completion Notes
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail what was discussed or accomplished..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evidence (Optional Image/Document)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-primary/50 transition-colors bg-gray-50/50">
              <div className="space-y-1 text-center">
                <HiOutlinePhotograph className="mx-auto h-10 w-10 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-transparent font-medium text-primary focus-within:outline-none hover:text-primary-dark">
                    <span>{file ? file.name : 'Upload a file'}</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setFile(e.target.files[0])} />
                  </label>
                </div>
                {!file && <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function FieldWorkPage() {
  const navigate = useNavigate();
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination(30);
  
  // State for the Report Modal
  const [reportModalItem, setReportModalItem] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (debouncedKeyword) {
        res = await interventionApi.getMySchedule({ page: 0, size: 200 });
      } else {
        res = await interventionApi.getMySchedule({
          page: pagination.page,
          size: pagination.size,
          status: statusFilter || undefined,
        });
      }
      const body = res;
      const page = body?.data !== undefined ? body.data : body;
      const list = Array.isArray(page?.content) ? page.content : [];
      setRawData(list);
      if (debouncedKeyword) {
        pagination.updateFromResponse({ totalElements: list.length, totalPages: 1, page: 0, size: list.length });
      } else {
        pagination.updateFromResponse(page || {});
      }
    } catch {
      toast.error('Failed to load field work data');
      setRawData([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, statusFilter, pagination.page, pagination.size]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const data = useMemo(() => {
    const byFieldType = rawData.filter((i) => isFieldType(i.type));
    if (!debouncedKeyword) return byFieldType;
    const k = debouncedKeyword.toLowerCase();
    return byFieldType.filter(
      (i) =>
        (i.title || '').toLowerCase().includes(k) ||
        (i.location || '').toLowerCase().includes(k) ||
        (i.caseNumber || '').toLowerCase().includes(k) ||
        (i.interventionCode || '').toLowerCase().includes(k)
    );
  }, [rawData, debouncedKeyword]);

  const todayVisits = useMemo(() => data.filter((i) => i.plannedStartDatetime && isToday(i.plannedStartDatetime)), [data]);
  const upcomingVisits = useMemo(() => data.filter((i) => !i.plannedStartDatetime || !isToday(i.plannedStartDatetime)), [data]);
  const completedCount = useMemo(() => data.filter((i) => i.status === 'COMPLETED').length, [data]);

  // Handle setting arrival
  const handleArrival = async (id) => {
    try {
      await interventionApi.update(id, { 
        status: 'IN_PROGRESS',
        actualStartDatetime: new Date().toISOString() 
      });
      toast.success("Arrival recorded! Start your field work.");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.message || 'Failed to record arrival');
    }
  };

  // Handle submitting the report outcome from the modal
  const handleReportSubmit = async (item, effectiveness, notes, file) => {
    try {
      // 1. Upload evidence if provided
      if (file) {
        await documentApi.upload(file, item.caseId, item.id);
      }
      
      // 2. Update the intervention
      await interventionApi.update(item.id, {
        status: 'COMPLETED',
        effectivenessPercent: effectiveness,
        completionNotes: notes,
        completedAt: new Date().toISOString()
      });
      
      toast.success("Visit outcome and evidence reported successfully!");
      setReportModalItem(null);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.message || 'Failed to submit report');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Field Work"
        badgeIcon={HiOutlineMap}
        title="Field Work"
        subtitle="Track your home visits, get directions, and report outcomes"
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
        <div className="p-6 space-y-6">
          {!loading && data.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-xl border border-green-100 p-4">
                <div className="flex items-center gap-2 text-green-700 mb-1">
                  <HiOutlineCalendar className="w-5 h-5" />
                  <span className="text-sm font-medium">Today</span>
                </div>
                <p className="text-2xl font-bold text-green-800">{todayVisits.length}</p>
                <p className="text-xs text-green-600">visits scheduled</p>
              </div>
              <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-1">
                  <HiOutlineClock className="w-5 h-5" />
                  <span className="text-sm font-medium">Upcoming</span>
                </div>
                <p className="text-2xl font-bold text-blue-800">{upcomingVisits.length}</p>
                <p className="text-xs text-blue-600">field activities</p>
              </div>
              <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4">
                <div className="flex items-center gap-2 text-emerald-700 mb-1">
                  <HiOutlineCheck className="w-5 h-5" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <p className="text-2xl font-bold text-emerald-800">{completedCount}</p>
                <p className="text-xs text-emerald-600">this period</p>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-gray-700 mb-1">
                  <HiOutlineHome className="w-5 h-5" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{data.length}</p>
                <p className="text-xs text-gray-600">field activities</p>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => { handleSearch(e); pagination.resetPage?.(); }}
                placeholder="Search by title, location, case..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Status:</span>
              <button
                onClick={() => { setStatusFilter(''); pagination.resetPage?.(); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!statusFilter ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All
              </button>
              {Object.values(INTERVENTION_STATUSES).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); pagination.resetPage?.(); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {formatEnum(s)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-gray-50/50 border border-gray-100">
              <HiOutlineMap className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">No field visits yet</p>
              <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
                Plan a home visit or field activity from Interventions. Your home visits and field activities will appear here.
              </p>
              <Button className="mt-4" onClick={() => navigate('/social-worker/interventions')} icon={HiOutlinePlus}>
                Plan intervention
              </Button>
            </div>
          ) : (
            <>
              {!debouncedKeyword && todayVisits.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <HiOutlineCalendar className="w-4 h-4 text-primary" />
                    Today&apos;s visits ({todayVisits.length})
                  </h3>
                  <div className="space-y-3">
                    {todayVisits.map((item) => (
                      <FieldVisitCard 
                        key={item.id} 
                        item={item} 
                        onView={() => navigate(`/social-worker/interventions/${item.id}`)} 
                        onArrival={() => handleArrival(item.id)}
                        onReport={() => setReportModalItem(item)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <HiOutlineDocumentText className="w-4 h-4 text-primary" />
                  {debouncedKeyword ? 'Search results' : upcomingVisits.length > 0 ? 'Upcoming & other' : 'All field activities'}
                </h3>
                <div className="space-y-3">
                  {(debouncedKeyword ? data : upcomingVisits).map((item) => (
                    <FieldVisitCard 
                      key={item.id} 
                      item={item} 
                      onView={() => navigate(`/social-worker/interventions/${item.id}`)} 
                      onArrival={() => handleArrival(item.id)}
                      onReport={() => setReportModalItem(item)}
                    />
                  ))}
                </div>
              </div>

              {pagination.totalPages > 1 && !debouncedKeyword && (
                <Pagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  totalElements={pagination.totalElements}
                  onPageChange={pagination.goToPage}
                />
              )}
            </>
          )}
        </div>
      </div>

      <ReportModal 
        isOpen={!!reportModalItem}
        item={reportModalItem}
        onClose={() => setReportModalItem(null)}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}

function FieldVisitCard({ item, onView, onArrival, onReport }) {
  const isTodayItem = item.plannedStartDatetime && isToday(item.plannedStartDatetime);
  const isHomeVisit = item.type === 'HOME_VISIT';

  const openGoogleMaps = () => {
    if (!item.location) {
      toast.info("No location specified for this visit");
      return;
    }
    const encodedLocation = encodeURIComponent(item.location);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
  };

  return (
    <div
      onClick={onView}
      className={`group rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
        isTodayItem ? 'border-green-300 bg-green-50/50' : 'border-gray-100 bg-white hover:border-primary/20'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`p-1.5 rounded-lg ${isHomeVisit ? 'bg-green-100 text-green-700' : 'bg-teal-100 text-teal-700'}`}>
              {isHomeVisit ? <HiOutlineHome className="w-4 h-4" /> : <HiOutlineLocationMarker className="w-4 h-4" />}
            </span>
            <span className="font-semibold text-gray-900 truncate">{item.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-500 flex items-center gap-1">
              <HiOutlineCalendar className="w-3.5 h-3.5" />
              {item.plannedStartDatetime ? formatDateTime(item.plannedStartDatetime) : '—'}
            </span>
            {item.durationMinutes && (
              <span className="text-gray-400 flex items-center gap-1">
                <HiOutlineClock className="w-3.5 h-3.5" /> {item.durationMinutes} min
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={item.status} />
            <span className="text-xs px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
              {formatEnum(item.type)}
            </span>
            {item.caseNumber && <span className="text-xs text-gray-500 font-mono">Case: {item.caseNumber}</span>}
          </div>
          {item.location && (
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
              <HiOutlineLocationMarker className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
              <span className="truncate max-w-[200px] sm:max-w-xs">{item.location}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openGoogleMaps();
                }}
                className="ml-2 px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                title="Open in Google Maps"
              >
                <HiOutlineMap className="w-3 h-3" /> MAP
              </button>
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onView}
            className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
            title="View details"
          >
            <HiOutlineEye className="w-5 h-5" />
          </button>
          
          {(item.status === 'SCHEDULED' || item.status === 'PLANNED') && (
            <button
              onClick={onArrival}
              className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors font-semibold text-xs flex items-center gap-1"
              title="I have arrived at the location"
            >
              <HiOutlineLocationMarker className="w-4 h-4" /> I'M HERE
            </button>
          )}
          
          {item.status === 'IN_PROGRESS' && (
            <button
              onClick={onReport}
              className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white transition-colors font-semibold text-xs flex items-center gap-1 shadow-sm"
              title="Report outcome of the visit"
            >
              <HiOutlineCheck className="w-4 h-4" /> REPORT
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
