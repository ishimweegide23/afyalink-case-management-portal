/** AfyaLink system operations began January 2025 */
export const SYSTEM_START_YEAR = 2025;
export const SYSTEM_START_MONTH = '2025-01';
export const SYSTEM_START_DATE = '2025-01-01';

/** Server calendar date (YYYY-MM-DD), set on app load from GET /api/system/date */
let serverTodayISO = null;

export function setServerToday(isoDate) {
  if (isoDate && /^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    serverTodayISO = isoDate;
  }
}

/** Local calendar date — avoids UTC off-by-one from toISOString() */
export function formatLocalISO(date) {
  const d = date instanceof Date ? date : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayDate() {
  if (serverTodayISO) {
    const [y, m, d] = serverTodayISO.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date();
}

export function getTodayISO() {
  return serverTodayISO || formatLocalISO(new Date());
}

export function getCurrentYear() {
  return getTodayDate().getFullYear();
}

export function getCurrentMonthString() {
  const t = getTodayDate();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
}

export function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

export function getCurrentWeekString() {
  const today = getTodayDate();
  return `${today.getFullYear()}-W${String(getWeekNumber(today)).padStart(2, '0')}`;
}

export function parseISODate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function capToToday(date) {
  const today = getTodayDate();
  today.setHours(23, 59, 59, 999);
  return date > today ? today : date;
}

/**
 * End of selected period, never after today.
 * MONTHLY: last day of month capped to today (current month works on May 26).
 */
export function resolvePeriodEnd(periodType, selection) {
  const today = getTodayDate();
  const p = (periodType || 'MONTHLY').toUpperCase();

  if (p === 'MONTHLY' && selection?.month) {
    const [y, m] = selection.month.split('-').map(Number);
    const lastDay = new Date(y, m, 0);
    return formatLocalISO(capToToday(lastDay));
  }

  if (p === 'YEARLY' && selection?.year != null) {
    const y = parseInt(selection.year, 10);
    const lastDay = new Date(y, 11, 31);
    return formatLocalISO(capToToday(lastDay));
  }

  if (p === 'WEEKLY' && selection?.week) {
    const [y, wPart] = selection.week.split('-W');
    const year = parseInt(y, 10);
    const week = parseInt(wPart, 10);
    const jan4 = new Date(year, 0, 4);
    const start = new Date(jan4);
    start.setDate(jan4.getDate() - (jan4.getDay() + 6) % 7 + (week - 1) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return formatLocalISO(capToToday(end));
  }

  if (selection?.anchorDate) {
    return formatLocalISO(capToToday(parseISODate(selection.anchorDate)));
  }

  return getTodayISO();
}

export function resolvePeriodStart(periodType, periodEndIso) {
  const end = parseISODate(periodEndIso);
  const start = new Date(end);
  const p = (periodType || 'MONTHLY').toUpperCase();

  if (p === 'WEEKLY') {
    const day = end.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(end.getDate() - diff);
  } else if (p === 'YEARLY') {
    start.setMonth(0, 1);
  } else {
    start.setDate(1);
  }

  const systemStart = parseISODate(SYSTEM_START_DATE);
  if (start < systemStart) return SYSTEM_START_DATE;
  return formatLocalISO(start);
}

/** Validate end date for analytics dashboards */
export function validateAnalyticsEndDate(endDateIso) {
  const end = parseISODate(endDateIso);
  const today = getTodayDate();
  today.setHours(23, 59, 59, 999);
  const systemStart = parseISODate(SYSTEM_START_DATE);

  if (!end || Number.isNaN(end.getTime())) {
    return { valid: false, message: 'Invalid date selected.' };
  }

  if (end > today) {
    return {
      valid: false,
      message: `Cannot load data for future dates. Please select ${getTodayISO()} or earlier.`,
    };
  }

  if (end < systemStart) {
    return {
      valid: true,
      emptyBecauseBeforeSystem: true,
      message: `No data available before ${SYSTEM_START_DATE}. AfyaLink records started in ${SYSTEM_START_YEAR}.`,
    };
  }

  return { valid: true, emptyBecauseBeforeSystem: false, message: null };
}

export function clampYear(yearStr) {
  const y = parseInt(yearStr, 10);
  const max = getCurrentYear();
  if (Number.isNaN(y) || y < SYSTEM_START_YEAR) return String(SYSTEM_START_YEAR);
  if (y > max) return String(max);
  return String(y);
}

export function clampMonth(monthStr) {
  const max = getCurrentMonthString();
  if (!monthStr || monthStr < SYSTEM_START_MONTH) return SYSTEM_START_MONTH;
  if (monthStr > max) return max;
  return monthStr;
}

export function clampWeek(weekStr) {
  const max = getCurrentWeekString();
  if (!weekStr || weekStr < `${SYSTEM_START_YEAR}-W01`) return `${SYSTEM_START_YEAR}-W01`;
  if (weekStr > max) return max;
  return weekStr;
}

/** Compute period start/end from period type and selection (anchor date or YYYY-MM / YYYY-MM-DD) */
export function computePeriod(periodType, input) {
  const p = (periodType || 'MONTHLY').toUpperCase();
  let endIso;

  if (typeof input === 'object' && input !== null) {
    endIso = resolvePeriodEnd(p, input);
  } else if (p === 'MONTHLY' && typeof input === 'string') {
    const monthKey = input.length === 7 ? input : input.slice(0, 7);
    endIso = resolvePeriodEnd('MONTHLY', { month: monthKey });
  } else if (p === 'YEARLY' && typeof input === 'string') {
    const year = input.length === 4 ? input : String(parseISODate(input).getFullYear());
    endIso = resolvePeriodEnd('YEARLY', { year });
  } else if (p === 'WEEKLY' && typeof input === 'string' && input.includes('-W')) {
    endIso = resolvePeriodEnd('WEEKLY', { week: input });
  } else if (input) {
    endIso = formatLocalISO(capToToday(parseISODate(input)));
  } else {
    endIso = getTodayISO();
  }

  const periodStart = resolvePeriodStart(p, endIso);
  return {
    periodStart,
    periodEnd: endIso,
    periodType: p,
    start: periodStart,
    end: endIso,
  };
}

export function validatePeriodRange(periodStart, periodEnd) {
  const v = validateAnalyticsEndDate(periodEnd);
  if (!v.valid) return { valid: false, message: v.message };
  if (v.emptyBecauseBeforeSystem) {
    return { valid: true, emptyBecauseBeforeSystem: true, message: v.message };
  }
  if (periodStart && periodEnd && periodStart > periodEnd) {
    return { valid: false, message: 'Period start cannot be after period end.' };
  }
  return { valid: true };
}

export function extractApiErrorMessage(err) {
  return (
    err?.response?.data?.message
    || err?.response?.data?.error
    || err?.message
    || 'Request failed'
  );
}

/** Fetch server date once and cache for date pickers */
export async function initServerDate(systemApi) {
  try {
    const res = await systemApi.getServerDate();
    const data = res?.data?.data ?? res?.data ?? res;
    if (data?.currentDate) setServerToday(data.currentDate);
  } catch {
    setServerToday(formatLocalISO(new Date()));
  }
  return getTodayISO();
}
