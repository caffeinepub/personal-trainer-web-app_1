/**
 * Shared utilities for handling per-set target weights in workouts.
 * Provides normalization, validation, and formatting helpers.
 */

/**
 * Normalize per-set weights array to match the target set count.
 * If the array is shorter, pad with the last value or 0.
 * If longer, truncate.
 */
export function normalizeSetWeights(weights: string[], targetSetCount: number): string[] {
  if (weights.length === targetSetCount) {
    return weights;
  }
  
  if (weights.length < targetSetCount) {
    const lastWeight = weights.length > 0 ? weights[weights.length - 1] : '';
    return [...weights, ...Array(targetSetCount - weights.length).fill(lastWeight)];
  }
  
  return weights.slice(0, targetSetCount);
}

/**
 * Validate that all per-set weights are non-negative numbers.
 * Returns an error message if invalid, or null if valid.
 */
export function validateSetWeights(weights: string[], exerciseName: string): string | null {
  for (let i = 0; i < weights.length; i++) {
    const weight = weights[i];
    if (!weight || weight.trim() === '') {
      return `${exerciseName}: Weight for Set ${i + 1} is required`;
    }
    
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight < 0) {
      return `${exerciseName}: Weight for Set ${i + 1} must be a non-negative number`;
    }
  }
  
  return null;
}

/**
 * Format per-set weights for display.
 * Returns a string like "Set 1: 50kg, Set 2: 52.5kg, Set 3: 55kg"
 */
export function formatSetWeights(weights: bigint[]): string {
  if (weights.length === 0) {
    return 'No weights set';
  }
  
  return weights
    .map((weight, idx) => `Set ${idx + 1}: ${Number(weight)}kg`)
    .join(', ');
}

/**
 * Check if a workout exercise has per-set weights defined.
 * Returns true if setWeights array exists and has at least one entry.
 */
export function hasPerSetWeights(setWeights: bigint[] | undefined): boolean {
  return Array.isArray(setWeights) && setWeights.length > 0;
}

/**
 * Convert string array to bigint array for backend submission.
 */
export function convertSetWeightsToBigInt(weights: string[]): bigint[] {
  return weights.map(w => BigInt(Math.round(parseFloat(w))));
}
