// src/utils/helpers.js

/**
 * Format a number as Indian Rupee currency string.
 * e.g. 12450 => "₹12,450"
 */
export function formatINR(amount) {
  if (amount === undefined || amount === null) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

/**
 * Return a "YYYY-MM" key string for a given date string (YYYY-MM-DD).
 */
export function getMonthKey(dateStr) {
  if (!dateStr) return '';
  return dateStr.substring(0, 7); // "2026-10"
}

/**
 * Format a month key "YYYY-MM" to human-readable "October 2026"
 */
export function formatMonthLabel(monthKey) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/**
 * Format a date string "YYYY-MM-DD" to "05 Oct 2026"
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Get today's date as a YYYY-MM-DD string in local time.
 */
export function getTodayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Get the current month key "YYYY-MM"
 */
export function getCurrentMonthKey() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

/**
 * Generate a unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Compute summary statistics from an array of expenses
 */
export function computeStats(expenses) {
  if (!expenses || expenses.length === 0) {
    return { total: 0, count: 0, average: 0, highest: 0 };
  }
  const total = expenses.reduce((sum, e) => sum + Number(e.price), 0);
  const count = expenses.length;
  const average = total / count;
  const highest = Math.max(...expenses.map(e => Number(e.price)));
  return { total, count, average, highest };
}

/**
 * Generate a consistent pastel color for any category string.
 * Uses a simple hash so the same category name always gets the same color.
 */
const PALETTE = [
  { bg: '#dcfce7', text: '#16a34a' },
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#fef3c7', text: '#d97706' },
  { bg: '#f3e8ff', text: '#7c3aed' },
  { bg: '#fee2e2', text: '#dc2626' },
  { bg: '#e0f2fe', text: '#0891b2' },
  { bg: '#fce7f3', text: '#be185d' },
  { bg: '#ecfdf5', text: '#059669' },
  { bg: '#fef9c3', text: '#ca8a04' },
  { bg: '#f1f5f9', text: '#475569' },
];

export function getCategoryColor(category) {
  if (!category) return PALETTE[PALETTE.length - 1];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
