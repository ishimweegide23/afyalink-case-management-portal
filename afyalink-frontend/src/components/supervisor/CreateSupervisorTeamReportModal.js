import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { reportsApi } from '../../api/reportsApi';
import Button from '../common/Button';
import {
  HiOutlineX,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlinePencil,
  HiOutlineClipboardList,
} from 'react-icons/hi';

// ── helpers ──────────────────────────────────────────────────────────────────

function toISO(d) { return d.toISOString().slice(0, 10); }

function getWeekStart(ref = new Date()) {
  const d = new Date(ref);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); d.setHours(0, 0, 0, 0);
  return d;
}
function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  return d;
}

function computeDates(periodType, refDate) {
  const ref = refDate ? new Date(refDate) : new Date();
  if (periodType === 'WEEKLY') {
    const s = getWeekStart(ref);
    return { start: toISO(s), end: toISO(getWeekEnd(s)) };
  }
  if (periodType === 'MONTHLY') {
    const s = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const e = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
    return { start: toISO(s), end: toISO(e) };
  }
  if (periodType === 'YEARLY') {
    return {
      start: `${ref.getFullYear()}-01-01`,
      end: `${ref.getFullYear()}-12-31`,
    };
  }
  // CUSTOM — caller sets dates manually
  const today = toISO(new Date());
  return { start: today, end: today };
}

function buildAutoTitle(periodType, start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  if (periodType === 'WEEKLY') {
    return `Team Weekly Report – ${fmt(s)} to ${fmt(e)}`;
  }
  if (periodType === 'MONTHLY') {
    return `Team Monthly Report – ${s.toLocaleString('default', { month: 'long', year: 'numeric' })}`;
  }
  if (periodType === 'YEARLY') {
    return `Team Annual Report – ${s.getFullYear()}`;
  }
  return `Team Consolidated Report – ${fmt(s)} to ${fmt(e)}`;
}

// ── component ─────────────────────────────────────────────────────────────────

const PERIOD_TYPES = [
  { value: 'WEEKLY',  label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY',  label: 'Yearly' },
  { value: 'CUSTOM',  label: 'Custom period' },
];

export default function CreateSupervisorTeamReportModal({ isOpen, onClose, onCreated }) {
  const [periodType, setPeriodType]         = useState('WEEKLY');
  const [refDate,    setRefDate]             = useState(toISO(new Date()));
  const [periodStart, setPeriodStart]        = useState('');
  const [periodEnd,   setPeriodEnd]          = useState('');
  const [title,       setTitle]              = useState('');
  const [titleEdited, setTitleEdited]        = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [loading, setLoading]               = useState(false);

  // ── recompute dates when type or refDate changes ──
  useEffect(() => {
    const { start, end } = computeDates(periodType, refDate);
    setPeriodStart(start);
    setPeriodEnd(end);
  }, [periodType, refDate]);

  // ── auto-title when dates change (unless user manually typed something) ──
  useEffect(() => {
    if (!titleEdited && periodStart && periodEnd) {
      setTitle(buildAutoTitle(periodType, periodStart, periodEnd));
    }
  }, [periodType, periodStart, periodEnd, titleEdited]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }
    if (!periodStart || !periodEnd || periodEnd < periodStart) {
      toast.error('Period end must be on or after period start');
      return;
    }
    setLoading(true);
    try {
      const body = {
        periodStart,
        periodEnd,
        title: title.trim(),
        ...(additionalNotes.trim() ? { additionalNotes: additionalNotes.trim() } : {}),
      };
      const res = await reportsApi.createSupervisorTeamReport(body);
      const dto = res?.data ?? res;
      toast.success('Consolidated report created as draft. Review → Finalize → Submit.');
      onCreated?.(dto);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Could not create report';
      toast.error(typeof msg === 'string' ? msg : 'Could not create report');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        {/* backdrop */}
        <button
          type="button"
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
          aria-label="Close"
          onClick={handleClose}
        />

        {/* modal */}
        <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-800 overflow-hidden">
          {/* gradient header */}
          <div className="relative bg-gradient-to-br from-primary via-primary-600 to-secondary px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/15 border border-white/20">
                  <HiOutlineClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Create Team Consolidated Report</h2>
                  <p className="text-white/75 text-xs mt-0.5">Supervisor role — pulls your team's metrics automatically</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* ── Period Type ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <HiOutlineDocumentText className="inline w-4 h-4 mr-1 text-primary" />
                Report Period Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PERIOD_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setPeriodType(value); setTitleEdited(false); }}
                    className={`py-2 px-3 rounded-xl text-sm font-semibold border transition-all ${
                      periodType === value
                        ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Date Controls ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <HiOutlineCalendar className="inline w-4 h-4 mr-1 text-primary" />
                {periodType === 'CUSTOM' ? 'Custom Period' : `Reference Date (${periodType})`}
              </label>

              {periodType === 'CUSTOM' ? (
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-gray-500 font-medium">Start date</span>
                    <input
                      type="date"
                      required
                      value={periodStart}
                      onChange={(e) => { setPeriodStart(e.target.value); setTitleEdited(false); }}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-500 font-medium">End date</span>
                    <input
                      type="date"
                      required
                      value={periodEnd}
                      onChange={(e) => { setPeriodEnd(e.target.value); setTitleEdited(false); }}
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900"
                    />
                  </label>
                </div>
              ) : (
                <>
                  <input
                    type={periodType === 'YEARLY' ? 'number' : 'date'}
                    min={periodType === 'YEARLY' ? 2020 : undefined}
                    max={periodType === 'YEARLY' ? new Date().getFullYear() : undefined}
                    value={periodType === 'YEARLY' ? new Date(refDate).getFullYear() : refDate}
                    onChange={(e) => {
                      const v = periodType === 'YEARLY' ? `${e.target.value}-06-01` : e.target.value;
                      setRefDate(v);
                      setTitleEdited(false);
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900"
                  />
                  {/* computed range pill */}
                  {periodStart && periodEnd && (
                    <div className="mt-2 px-3 py-1.5 bg-primary/8 rounded-lg text-xs text-primary font-medium border border-primary/15">
                      Period: {new Date(periodStart).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' '}–{' '}
                      {new Date(periodEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Title ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                <HiOutlinePencil className="inline w-4 h-4 mr-1 text-primary" />
                Report Title
              </label>
              <input
                type="text"
                required
                minLength={5}
                value={title}
                onChange={(e) => { setTitle(e.target.value); setTitleEdited(true); }}
                placeholder="Auto-generated or type a custom title…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900"
              />
              {titleEdited && (
                <button
                  type="button"
                  className="mt-1 text-xs text-primary hover:underline"
                  onClick={() => { setTitleEdited(false); }}
                >
                  ↺ Reset to auto-generated title
                </button>
              )}
            </div>

            {/* ── Additional Notes ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Additional Notes <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                maxLength={4000}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900 resize-none"
                placeholder="Any extra context or observations for this period…"
              />
            </div>

            {/* ── info note ── */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
              The report narrative will be <strong>auto-generated</strong> from your team's submitted reports.<br/>
              After creation: open the draft → edit the auto-generated text if needed → <strong>Finalize</strong> → <strong>Submit to Admin</strong>.
            </div>

            {/* ── Footer ── */}
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="ghost" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" loading={loading} disabled={loading}>
                {loading ? 'Creating…' : 'Create Draft Report'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
