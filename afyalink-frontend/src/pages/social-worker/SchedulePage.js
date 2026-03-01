import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { scheduleApi } from '../../api/scheduleApi';
import { interventionApi } from '../../api/interventionApi';
import { caseEntryApi } from '../../api/caseEntryApi';
import { formatDateTime, isToday } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';
import { ROUTES } from '../../routes/routeConstants';
import StatusBadge from '../../components/shared/StatusBadge';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import {
  HiOutlineEye,
  HiOutlineCalendar,
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineClipboardList,
  HiOutlinePlay,
  HiOutlineCheck,
  HiOutlinePlus,
  HiOutlineDocumentText,
  HiOutlineExclamation,
  HiOutlinePencil,
  HiOutlineRefresh,
  HiOutlineViewList,
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi';
import { 
  startOfWeek, 
  endOfWeek, 
  addWeeks, 
  addMonths, 
  format as fmt, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay
} from 'date-fns';

const TYPE_INTERVENTION = 'INTERVENTION';
const TYPE_TASK = 'TASK';

function getInitialRange() {
  const now = new Date();
  return {
    from: fmt(now, 'yyyy-MM-dd'),
    to: fmt(addWeeks(now, 2), 'yyyy-MM-dd'),
  };
}

export default function SchedulePage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getInitialRange);
  const [actionLoading, setActionLoading] = useState(null);
  
  // New State variables for features
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  const { from, to } = dateRange;

  const setPreset = (preset) => {
    const now = new Date();
    if (preset === 'week') {
      setDateRange({
        from: fmt(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        to: fmt(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      });
    } else if (preset === 'month') {
      const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setDateRange({
        from: fmt(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'),
        to: fmt(endMonth, 'yyyy-MM-dd'),
      });
    } else {
      setDateRange({
        from: fmt(now, 'yyyy-MM-dd'),
        to: fmt(addWeeks(now, 2), 'yyyy-MM-dd'),
      });
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await scheduleApi.getSchedule({ fromDate: from, toDate: to });
      const items = res?.data ?? res;
      setData(Array.isArray(items) ? items : []);
    } catch {
      toast.error('Failed to load schedule');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInterventionStatus = async (id, newStatus) => {
    setActionLoading(id);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'COMPLETED') {
        payload.completedAt = new Date().toISOString();
      }
      await interventionApi.update(id, payload);
      toast.success(`Updated to ${formatEnum(newStatus)}`);
      fetchData();
    } catch { toast.error('Failed to update'); }
    finally { setActionLoading(null); }
  };

  const handleTaskStatus = async (item, newStatus) => {
    if (!item.caseId) return;
    setActionLoading(`task-${item.id}`);
    try {
      const payload = { status: newStatus };
      if (newStatus === 'COMPLETED') {
        payload.completedAt = new Date().toISOString();
      }
      await caseEntryApi.update(item.caseId, item.id, payload);
      toast.success(newStatus === 'COMPLETED' ? 'Task marked complete' : 'Task reopened');
      fetchData();
    } catch { toast.error('Failed to update task'); }
    finally { setActionLoading(null); }
  };
  
  // Batch complete
  const handleBatchComplete = async () => {
    if (selectedItems.size === 0) return;
    
    setLoading(true);
    let successCount = 0;
    
    for (const itemId of selectedItems) {
      const [type, id] = itemId.split('-');
      const item = data.find(i => i.id.toString() === id && i.type === (type === 'TASK' ? TYPE_TASK : TYPE_INTERVENTION));
      
      if (!item) continue;
      
      try {
        if (item.type === TYPE_INTERVENTION) {
          await interventionApi.update(item.id, { status: 'COMPLETED', completedAt: new Date().toISOString() });
        } else if (item.type === TYPE_TASK && item.caseId) {
          await caseEntryApi.update(item.caseId, item.id, { status: 'COMPLETED', completedAt: new Date().toISOString() });
        }
        successCount++;
      } catch (err) {
        console.error("Failed to complete item", item, err);
      }
    }
    
    toast.success(`Successfully completed ${successCount} items`);
    setSelectedItems(new Set());
    setIsBatchMode(false);
    fetchData();
  };

  const toggleSelection = (item) => {
    const key = `${item.type}-${item.id}`;
    const newSelected = new Set(selectedItems);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedItems(newSelected);
  };

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const getDateStr = (item) => {
    if (!item?.scheduleDateTime) return null;
    const s = item.scheduleDateTime;
    return typeof s === 'string' ? s.slice(0, 10) : (s.toISOString ? s.toISOString().slice(0, 10) : null);
  };
  
  const getHour = (item) => {
    if (!item?.scheduleDateTime) return null;
    const s = typeof item.scheduleDateTime === 'string' ? new Date(item.scheduleDateTime) : item.scheduleDateTime;
    return s.getHours();
  };

  const displayOverdue = data.filter((i) => {
    const d = getDateStr(i);
    return d && d < todayDateStr && i.status !== 'COMPLETED';
  });

  const todayItems = data.filter((i) => i.scheduleDateTime && isToday(i.scheduleDateTime));
  
  const displayMorning = todayItems.filter(i => getHour(i) < 12);
  const displayAfternoon = todayItems.filter(i => getHour(i) >= 12 && getHour(i) < 17);
  const displayEvening = todayItems.filter(i => getHour(i) >= 17);

  const displayUpcoming = data.filter((i) => {
    const d = getDateStr(i);
    return d && d > todayDateStr;
  });

  // Calendar Logic
  const calendarDays = useMemo(() => {
    if (viewMode !== 'calendar') return [];
    
    const start = startOfWeek(startOfMonth(new Date(from)), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(new Date(from)), { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start, end });
  }, [from, viewMode]);

  return (
    <>
      <div className="space-y-6 pb-8">
        <PageHeader
          badge="My Schedule"
          badgeIcon={HiOutlineCalendar}
          title="My Schedule"
          subtitle="Activities from your cases, interventions and tasks — view, add and mark complete"
          action={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setDateRange((r) => ({ ...r, from: e.target.value || todayDateStr }))}
                  className="px-2 py-1 rounded-lg border-0 bg-white/90 text-gray-800 text-sm focus:ring-2 focus:ring-white/50"
                />
                <span className="text-white/80">to</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setDateRange((r) => ({ ...r, to: e.target.value || to }))}
                  className="px-2 py-1 rounded-lg border-0 bg-white/90 text-gray-800 text-sm focus:ring-2 focus:ring-white/50"
                />
              </div>
              
              <div className="flex bg-white/20 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-white hover:bg-white/10'}`}
                  title="List View"
                >
                  <HiOutlineViewList className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-white text-primary shadow-sm' : 'text-white hover:bg-white/10'}`}
                  title="Calendar View"
                >
                  <HiOutlineCalendar className="w-5 h-5" />
                </button>
              </div>

              <Link to={`${ROUTES.SOCIAL_WORKER.INTERVENTIONS}/create`} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-primary border border-white text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                <HiOutlinePlus className="w-4 h-4" /> Add Task
              </Link>
            </div>
          }
        />

        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 space-y-6">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="flex gap-2">
              {[
                { key: 'week', label: 'Week' },
                { key: 'month', label: 'Month' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPreset(p.key)}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            
            {viewMode === 'list' && (
              <div className="flex items-center gap-3">
                {isBatchMode && selectedItems.size > 0 && (
                  <Button onClick={handleBatchComplete} disabled={loading} size="sm" className="!bg-green-600 hover:!bg-green-700">
                    <HiOutlineCheck className="w-4 h-4 mr-1" />
                    Complete Selected ({selectedItems.size})
                  </Button>
                )}
                <Button 
                  variant={isBatchMode ? "outline" : "primary"}
                  onClick={() => {
                    setIsBatchMode(!isBatchMode);
                    if (isBatchMode) setSelectedItems(new Set());
                  }} 
                  size="sm"
                >
                  {isBatchMode ? 'Cancel Batch' : 'Batch Complete'}
                </Button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 rounded-xl bg-gray-50/50 border border-gray-100">
              <HiOutlineCalendar className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">No activities in this date range</p>
              <p className="text-gray-500 text-sm mt-1">Schedule is built from your cases, interventions and tasks.</p>
            </div>
          ) : viewMode === 'calendar' ? (
            
            /* CALENDAR VIEW */
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 bg-gray-200 gap-px">
                {calendarDays.map(day => {
                  const dayItems = data.filter(i => {
                    const iDate = i.scheduleDateTime ? (typeof i.scheduleDateTime === 'string' ? new Date(i.scheduleDateTime) : i.scheduleDateTime) : null;
                    return iDate && isSameDay(iDate, day);
                  });
                  const isCurrentMonth = isSameMonth(day, new Date(from));
                  const isDayToday = isSameDay(day, new Date());
                  
                  return (
                    <div key={day.toString()} className={`min-h-[100px] bg-white p-2 ${!isCurrentMonth ? 'opacity-50' : ''} ${isDayToday ? 'bg-primary/5' : ''}`}>
                      <div className={`text-xs font-semibold mb-2 ${isDayToday ? 'text-primary' : 'text-gray-500'}`}>
                        {fmt(day, 'd')}
                      </div>
                      <div className="space-y-1 overflow-y-auto max-h-[80px] pr-1 custom-scrollbar">
                        {dayItems.map(item => (
                          <div 
                            key={`${item.type}-${item.id}`}
                            className={`text-[10px] p-1.5 rounded truncate font-medium cursor-pointer ${
                              item.status === 'COMPLETED' ? 'bg-gray-100 text-gray-500 line-through' :
                              item.type === TYPE_TASK ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                            }`}
                            onClick={() => item.type === TYPE_INTERVENTION ? navigate(`/social-worker/interventions/${item.id}`) : navigate(`/social-worker/cases/${item.caseId}`)}
                            title={item.title}
                          >
                            {item.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          ) : (
            
            /* LIST VIEW WITH TIME BLOCKS */
            <div className="space-y-8">
              {displayOverdue.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-red-700 mb-3 flex items-center gap-2 bg-red-50 p-2 rounded-lg">
                    <HiOutlineExclamation className="w-5 h-5" />
                    OVERDUE ({displayOverdue.length})
                  </h3>
                  <div className="space-y-3 pl-2">
                    {displayOverdue.map((item) => (
                      <ScheduleCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        navigate={navigate}
                        onInterventionStatus={handleInterventionStatus}
                        onTaskStatus={handleTaskStatus}
                        actionLoading={actionLoading}
                        isBatchMode={isBatchMode}
                        isSelected={selectedItems.has(`${item.type}-${item.id}`)}
                        onToggle={() => toggleSelection(item)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {displayMorning.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2 bg-amber-50 p-2 rounded-lg">
                    <HiOutlineSun className="w-5 h-5" />
                    MORNING (Before 12 PM)
                  </h3>
                  <div className="space-y-3 pl-2">
                    {displayMorning.map((item) => (
                      <ScheduleCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        navigate={navigate}
                        onInterventionStatus={handleInterventionStatus}
                        onTaskStatus={handleTaskStatus}
                        actionLoading={actionLoading}
                        isBatchMode={isBatchMode}
                        isSelected={selectedItems.has(`${item.type}-${item.id}`)}
                        onToggle={() => toggleSelection(item)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {displayAfternoon.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2 bg-primary/10 p-2 rounded-lg">
                    <HiOutlineClock className="w-5 h-5" />
                    AFTERNOON (12 PM - 5 PM)
                  </h3>
                  <div className="space-y-3 pl-2">
                    {displayAfternoon.map((item) => (
                      <ScheduleCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        navigate={navigate}
                        onInterventionStatus={handleInterventionStatus}
                        onTaskStatus={handleTaskStatus}
                        actionLoading={actionLoading}
                        isBatchMode={isBatchMode}
                        isSelected={selectedItems.has(`${item.type}-${item.id}`)}
                        onToggle={() => toggleSelection(item)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {displayEvening.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-indigo-600 mb-3 flex items-center gap-2 bg-indigo-50 p-2 rounded-lg">
                    <HiOutlineMoon className="w-5 h-5" />
                    EVENING (After 5 PM)
                  </h3>
                  <div className="space-y-3 pl-2">
                    {displayEvening.map((item) => (
                      <ScheduleCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        navigate={navigate}
                        onInterventionStatus={handleInterventionStatus}
                        onTaskStatus={handleTaskStatus}
                        actionLoading={actionLoading}
                        isBatchMode={isBatchMode}
                        isSelected={selectedItems.has(`${item.type}-${item.id}`)}
                        onToggle={() => toggleSelection(item)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {displayUpcoming.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                    <HiOutlineClipboardList className="w-5 h-5" />
                    UPCOMING ({displayUpcoming.length})
                  </h3>
                  <div className="space-y-3 pl-2">
                    {displayUpcoming.map((item) => (
                      <ScheduleCard
                        key={`${item.type}-${item.id}`}
                        item={item}
                        navigate={navigate}
                        onInterventionStatus={handleInterventionStatus}
                        onTaskStatus={handleTaskStatus}
                        actionLoading={actionLoading}
                        isBatchMode={isBatchMode}
                        isSelected={selectedItems.has(`${item.type}-${item.id}`)}
                        onToggle={() => toggleSelection(item)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ScheduleCard({ item, navigate, onInterventionStatus, onTaskStatus, actionLoading, isBatchMode, isSelected, onToggle }) {
  const isOverdue = item.scheduleDateTime && item.scheduleDateTime.slice && item.scheduleDateTime.slice(0, 10) < new Date().toISOString().slice(0, 10) && item.status !== 'COMPLETED';
  const isTodayItem = item.scheduleDateTime && isToday(item.scheduleDateTime);
  const isTask = item.type === TYPE_TASK;
  const isCompleted = item.status === 'COMPLETED';
  
  const onView = () => item.type === TYPE_INTERVENTION ? navigate(`/social-worker/interventions/${item.id}`) : navigate(`/social-worker/cases/${item.caseId}`);

  // Determine priority badge color (mocking if not available)
  const priority = item.priority || (isOverdue ? 'HIGH' : 'MEDIUM');
  const getPriorityColor = (p) => {
    switch (p?.toUpperCase()) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div
      onClick={isBatchMode && !isCompleted ? onToggle : onView}
      className={`group rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-primary bg-primary/5 ring-2 ring-primary/20' :
        isOverdue ? 'border-red-200 bg-red-50/50' : 
        isTodayItem ? 'border-primary/30 bg-white' : 'border-gray-100 bg-white hover:border-primary/20'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        
        {/* Checkbox for batch mode */}
        {isBatchMode && (
          <div className="flex items-center justify-center pr-2" onClick={(e) => e.stopPropagation()}>
            <input 
              type="checkbox"
              disabled={isCompleted}
              checked={isSelected}
              onChange={onToggle}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50 cursor-pointer"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${isTask ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'}`}>
              {isTask ? <HiOutlineDocumentText className="w-3.5 h-3.5" /> : <HiOutlineCalendar className="w-3.5 h-3.5" />}
              {isTask ? 'Task' : 'Intervention'}
            </span>
            
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${getPriorityColor(priority)}`}>
              {priority.toUpperCase()}
            </span>

            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 ml-auto">
              <HiOutlineClock className="w-4 h-4 text-gray-400" />
              {item.scheduleDateTime ? (isTask ? formatDateTime(item.scheduleDateTime).split(',')[0] : formatDateTime(item.scheduleDateTime)) : '—'}
            </span>
          </div>
          
          <h4 className={`font-bold truncate text-base ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.title}</h4>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge status={item.status} />
            {!isTask && item.interventionCode && (
              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{item.interventionCode}</span>
            )}
            {item.caseNumber && (
              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{item.caseNumber}</span>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        {!isBatchMode && (
          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={onView} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" title="View">
              <HiOutlineEye className="w-5 h-5" />
            </button>
            
            {!isTask && navigate && (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/social-worker/interventions/${item.id}/edit`); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Edit"
              >
                <HiOutlinePencil className="w-5 h-5" />
              </button>
            )}

            {isTask ? (
              <>
                {item.status !== 'COMPLETED' && (
                  <button
                    onClick={() => onTaskStatus(item, 'COMPLETED')}
                    disabled={actionLoading === `task-${item.id}`}
                    className="px-3 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors font-bold text-xs shadow-sm"
                    title="Mark complete"
                  >
                    <HiOutlineCheck className="w-4 h-4 inline mr-1" /> COMPLETE
                  </button>
                )}
                {item.status === 'COMPLETED' && (
                  <button
                    onClick={() => onTaskStatus(item, 'PENDING')}
                    disabled={actionLoading === `task-${item.id}`}
                    className="p-2 rounded-lg hover:bg-amber-100 text-amber-600 transition-colors"
                    title="Reopen task"
                  >
                    <HiOutlineRefresh className="w-5 h-5" />
                  </button>
                )}
              </>
            ) : (
              <>
                {(item.status === 'SCHEDULED' || item.status === 'PLANNED' || item.status === 'IN_PROGRESS') && (
                  <button
                    onClick={() => onInterventionStatus(item.id, 'COMPLETED')}
                    disabled={actionLoading === item.id}
                    className="px-3 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-colors font-bold text-xs shadow-sm flex items-center"
                    title="Mark complete"
                  >
                    <HiOutlineCheck className="w-4 h-4 mr-1" /> COMPLETE
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
