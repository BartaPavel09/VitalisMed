/**
 * Format a date string (YYYY-MM-DD or ISO timestamp) using the browser's native locale.
 *
 * @param {string} value Date or timestamp string.
 * @return {string} Formatted local date string.
 */
export function formatDate(value) {
  if (!value) return '—'
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day).toLocaleDateString()
  }
  return new Date(value).toLocaleDateString()
}

/**
 * Format a time string (HH:MM or HH:MM:SS) using the browser's native 12h/24h locale.
 *
 * @param {string} value Time string in HH:MM or HH:MM:SS format.
 * @return {string} Formatted local time string.
 */
export function formatTime(value) {
  if (!value) return '—'
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number)
  return new Date(2026, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format an ISO datetime string using the browser's native date and time locale.
 *
 * @param {string} value ISO datetime string.
 * @return {string} Formatted local date and time string.
 */
export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}
