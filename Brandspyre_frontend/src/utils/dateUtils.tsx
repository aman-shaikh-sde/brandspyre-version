// utils/dateUtils.js

/**
 * Formats a date or date range
 * @param {string|Date} startDate - The start date
 * @param {string|Date} [endDate] - Optional end date for date ranges
 * @returns {string} Formatted date string
 */
export const formatDate = (startDate, endDate) => {
  // If no endDate provided, just format single date
  if (!endDate) {
    return formatSingleDate(startDate);
  }
  
  // Format date range
  return formatDateRange(startDate, endDate);
};

/**
 * Formats a single date
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string (e.g., "12 May 2025")
 */
const formatSingleDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};

/**
 * Formats a date range intelligently
 * @param {string|Date} startDate - The start date
 * @param {string|Date} endDate - The end date
 * @returns {string} Formatted date range string
 */
const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // If same month and year, show "12-15 May 2025"
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}-${end.getDate()} ${formatSingleDate(start).split(' ')[1]} ${start.getFullYear()}`;
  }
  
  // If same year but different months, show "12 May - 15 Jun 2025"
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} ${formatSingleDate(start).split(' ')[1]} - ${end.getDate()} ${formatSingleDate(end).split(' ')[1]} ${end.getFullYear()}`;
  }
  
  // Default case: "12 May 2025 - 15 Jun 2026"
  return `${formatSingleDate(start)} - ${formatSingleDate(end)}`;
};