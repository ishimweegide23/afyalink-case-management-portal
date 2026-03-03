import { format, formatDistanceToNow, isToday as isTodayFns, parseISO } from 'date-fns';

function safeParse(dateString) {
  if (!dateString) return null;
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function formatDate(dateString) {
  const d = safeParse(dateString);
  return d ? format(d, 'MMM dd, yyyy') : '—';
}

export function formatDateTime(dateString) {
  const d = safeParse(dateString);
  return d ? format(d, 'MMM dd, yyyy hh:mm a') : '—';
}

export function formatRelativeTime(dateString) {
  const d = safeParse(dateString);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDateForInput(dateString) {
  const d = safeParse(dateString);
  return d ? format(d, 'yyyy-MM-dd') : '';
}

/** For datetime-local input: "yyyy-MM-ddTHH:mm" */
export function formatDateTimeForInput(dateString) {
  const d = safeParse(dateString);
  return d ? format(d, "yyyy-MM-dd'T'HH:mm") : '';
}

export function isToday(dateString) {
  const d = safeParse(dateString);
  return d ? isTodayFns(d) : false;
}
