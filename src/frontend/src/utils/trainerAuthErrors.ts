/**
 * Utility functions for handling trainer authentication errors with deterministic English output
 */

/**
 * Extract a readable error message from various error formats
 */
export function extractErrorMessage(err: unknown): string {
  if (!err) return '';

  // Handle Error objects with message property
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message: string }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  // Handle string errors
  if (typeof err === 'string') {
    return err;
  }

  // Handle objects with toString
  if (err && typeof err === 'object' && 'toString' in err) {
    const errStr = String(err);
    
    // Extract from "Reject text: MESSAGE" format (common canister rejection format)
    const rejectMatch = errStr.match(/Reject text:\s*(.+?)(?:\n|$)/i);
    if (rejectMatch && rejectMatch[1]) {
      return rejectMatch[1].trim();
    }

    // Extract from "Call was rejected: MESSAGE" format
    const rejectedMatch = errStr.match(/Call was rejected:\s*(.+?)(?:\n|$)/i);
    if (rejectedMatch && rejectedMatch[1]) {
      return rejectedMatch[1].trim();
    }

    // Extract from "Error: MESSAGE" format
    if (errStr.startsWith('Error: ')) {
      return errStr.substring(7).trim();
    }

    return errStr;
  }

  return '';
}

/**
 * Map backend error messages to user-friendly English messages with deterministic categorization
 */
export function mapTrainerAuthError(rawError: string): string {
  const lowerError = rawError.toLowerCase();
  const trimmedError = rawError.trim();

  // Service unavailable (actor not ready, network issues)
  if (
    rawError === 'SERVICE_UNAVAILABLE' ||
    lowerError.includes('backend non disponibile') ||
    lowerError.includes('service unavailable') ||
    lowerError.includes('not available') ||
    lowerError.includes('actor not available') ||
    lowerError.includes('cannot read properties') ||
    lowerError.includes('network error') ||
    lowerError.includes('fetch failed') ||
    lowerError.includes('connection') ||
    lowerError.includes('timeout') ||
    lowerError.includes('unreachable')
  ) {
    return 'Service is temporarily unavailable. Please wait a moment and try again.';
  }

  // Wrong access code - backend returns: "Wrong access code. Please verify your credentials."
  if (
    lowerError.includes('wrong access code') ||
    lowerError.includes('verify your credentials') ||
    lowerError.includes('password') && (
      lowerError.includes('non è corretta') || 
      lowerError.includes('non e corretta') ||
      lowerError.includes('incorrect') ||
      lowerError.includes('not correct') ||
      lowerError.includes('wrong')
    )
  ) {
    return 'The access code you entered is incorrect. Please try again.';
  }

  // Authorization/permission errors (not authenticated, wrong role)
  if (
    lowerError.includes('unauthorized') ||
    lowerError.includes('only admins') ||
    lowerError.includes('assign user roles') ||
    lowerError.includes('access denied') ||
    lowerError.includes('permission')
  ) {
    return 'Access denied. You do not have permission to access this area.';
  }

  // If we have a non-empty error that doesn't match specific categories,
  // treat it as a generic authentication failure
  if (trimmedError !== '') {
    // Check if it looks like a backend rejection (contains "trap" or similar canister error indicators)
    if (lowerError.includes('trap') || lowerError.includes('reject')) {
      return 'The access code you entered is incorrect. Please try again.';
    }
    
    return 'Unable to authenticate. Please verify your access code.';
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Map backend error messages for trainer code change operations to user-friendly English messages
 */
export function mapTrainerCodeChangeError(rawError: string): string {
  const lowerError = rawError.toLowerCase();
  const trimmedError = rawError.trim();

  // Service unavailable
  if (
    rawError === 'SERVICE_UNAVAILABLE' ||
    lowerError.includes('service unavailable') ||
    lowerError.includes('not available') ||
    lowerError.includes('actor not available') ||
    lowerError.includes('network error') ||
    lowerError.includes('fetch failed') ||
    lowerError.includes('connection') ||
    lowerError.includes('timeout')
  ) {
    return 'Service is temporarily unavailable. Please wait a moment and try again.';
  }

  // Current code is incorrect - backend returns: "The current code is incorrect."
  if (
    lowerError.includes('current code is incorrect') ||
    lowerError.includes('current code') && lowerError.includes('incorrect')
  ) {
    return 'The current access code you entered is incorrect. Please verify and try again.';
  }

  // New code validation errors - backend returns: "The new code should be at least 5 characters long and should not exceed 20 characters."
  if (
    lowerError.includes('new code should be') ||
    lowerError.includes('at least 5 characters') ||
    lowerError.includes('should not exceed 20 characters') ||
    (lowerError.includes('new code') && (lowerError.includes('characters') || lowerError.includes('length')))
  ) {
    return 'The new access code must be between 5 and 20 characters long.';
  }

  // Unauthorized - backend returns: "Unauthorized: Only authenticated trainers can update their code"
  if (
    lowerError.includes('unauthorized') ||
    lowerError.includes('only authenticated trainers') ||
    lowerError.includes('permission')
  ) {
    return 'You do not have permission to change the access code. Please log in as a trainer.';
  }

  // Generic fallback for any other error
  if (trimmedError !== '') {
    return 'Unable to update the access code. Please try again.';
  }

  return 'An unexpected error occurred. Please try again.';
}
