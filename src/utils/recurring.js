/**
 * recurring.js — Utilities for recurring transaction logic.
 */

export const FREQUENCIES = [
  { id: 'monthly',  label: 'Monthly',  shortLabel: 'Mo' },
  { id: 'weekly',   label: 'Weekly',   shortLabel: 'Wk' },
  { id: 'yearly',   label: 'Yearly',   shortLabel: 'Yr' },
];

/**
 * Compute the next due date from the last logged date and frequency.
 * Returns a YYYY-MM-DD string.
 */
export function computeNextDue(dateStr, frequency) {
  if (!dateStr) return null;
  const d = new Date(dateStr.split('T')[0] + 'T00:00:00');
  if (isNaN(d.getTime())) return null;

  switch (frequency) {
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      d.setMonth(d.getMonth() + 1);
      break;
  }
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Returns how many days until the next due date (negative = overdue).
 */
export function daysUntilDue(nextDue) {
  if (!nextDue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(nextDue + 'T00:00:00');
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

/**
 * Returns a human-readable due label.
 */
export function dueLabel(days) {
  if (days === null) return '';
  if (days < 0)  return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7)  return `Due in ${days} days`;
  return `Due ${new Date(Date.now() + days * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
}

/**
 * Extract all unique recurring "templates" from the transactions list.
 * Groups by description+category, keeps the most recent as the template.
 */
export function getRecurringTemplates(transactions) {
  const map = {};
  transactions
    .filter(t => t.recurring === true || t.recurring === 'true')
    .forEach(t => {
      const key = `${(t.description || '').toLowerCase()}__${t.category}`;
      if (!map[key] || t.date > map[key].date) {
        map[key] = t;
      }
    });
  return Object.values(map).map(t => ({
    ...t,
    nextDue: computeNextDue(t.date, t.frequency || 'monthly'),
  })).sort((a, b) => (a.nextDue || '').localeCompare(b.nextDue || ''));
}
