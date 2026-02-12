/**
 * Utility functions for booking time conversions and formatting
 */

/**
 * Build a Date object from date and time input strings
 */
export function buildDateTimeFromInputs(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Compute duration in minutes between two Date objects
 */
export function computeDurationMinutes(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 60000);
}

/**
 * Format a Date object for date input (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object for time input (HH:MM)
 */
export function formatTimeForInput(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format backend Time (nanoseconds) to display time string (HH:MM)
 */
export function formatBookingTime(timeNanos: bigint): string {
  const date = new Date(Number(timeNanos / BigInt(1_000_000)));
  return formatTimeForInput(date);
}

/**
 * Convert Date to backend Time format (nanoseconds as bigint)
 */
export function dateToBackendTime(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

/**
 * Convert backend Time (nanoseconds) to Date
 */
export function backendTimeToDate(timeNanos: bigint): Date {
  return new Date(Number(timeNanos / BigInt(1_000_000)));
}
