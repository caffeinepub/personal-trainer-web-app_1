/**
 * Shared utilities for handling per-set rest times (seconds) in workouts.
 * Provides normalization, validation, and formatting helpers.
 */

/**
 * Normalize per-set rest times array to match the target set count.
 * If the array is shorter, pad with the last value or 60 (default).
 * If longer, truncate.
 */
export function normalizeRestTimes(restTimes: string[], targetSetCount: number): string[] {
  if (restTimes.length === targetSetCount) {
    return restTimes;
  }
  
  if (restTimes.length < targetSetCount) {
    const lastRestTime = restTimes.length > 0 ? restTimes[restTimes.length - 1] : '60';
    return [...restTimes, ...Array(targetSetCount - restTimes.length).fill(lastRestTime)];
  }
  
  return restTimes.slice(0, targetSetCount);
}

/**
 * Validate that all per-set rest times are non-negative integers.
 * Returns an error message if invalid, or null if valid.
 */
export function validateRestTimes(restTimes: string[], exerciseName: string): string | null {
  for (let i = 0; i < restTimes.length; i++) {
    const restTime = restTimes[i];
    if (!restTime || restTime.trim() === '') {
      return `${exerciseName}: Rest time for Set ${i + 1} is required`;
    }
    
    const numRestTime = parseInt(restTime);
    if (isNaN(numRestTime) || numRestTime < 0) {
      return `${exerciseName}: Rest time for Set ${i + 1} must be a non-negative integer`;
    }
    
    // Check if it's an integer (no decimals)
    if (restTime.includes('.')) {
      return `${exerciseName}: Rest time for Set ${i + 1} must be a whole number (no decimals)`;
    }
  }
  
  return null;
}

/**
 * Format per-set rest times for display.
 * Returns a string like "Set 1: 60s, Set 2: 90s, Set 3: 60s"
 */
export function formatRestTimes(restTimes: bigint[]): string {
  if (restTimes.length === 0) {
    return '';
  }
  
  return restTimes
    .map((restTime, idx) => `Set ${idx + 1}: ${Number(restTime)}s`)
    .join(', ');
}

/**
 * Check if a workout exercise has per-set rest times defined.
 * Returns true if restTimes array exists and has at least one entry.
 */
export function hasPerSetRestTimes(restTimes: bigint[] | undefined): boolean {
  return Array.isArray(restTimes) && restTimes.length > 0;
}

/**
 * Convert string array to bigint array for backend submission.
 */
export function convertRestTimesToBigInt(restTimes: string[]): bigint[] {
  return restTimes.map(rt => BigInt(parseInt(rt)));
}
