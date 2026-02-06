/**
 * Utility functions for handling trainer authentication errors
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
    
    // Extract from "Reject text: MESSAGE" format
    const rejectMatch = errStr.match(/Reject text:\s*(.+?)(?:\n|$)/i);
    if (rejectMatch && rejectMatch[1]) {
      return rejectMatch[1].trim();
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
 * Map backend error messages to user-friendly English messages
 */
export function mapTrainerAuthError(rawError: string): string {
  const lowerError = rawError.toLowerCase();

  // Service unavailable (actor not ready)
  if (
    rawError === 'SERVICE_UNAVAILABLE' ||
    lowerError.includes('backend non disponibile') ||
    lowerError.includes('service unavailable') ||
    lowerError.includes('not available') ||
    lowerError.includes('actor not available') ||
    lowerError.includes('cannot read properties') ||
    lowerError.includes('network error') ||
    lowerError.includes('fetch failed')
  ) {
    return 'Service is temporarily unavailable. Please wait a moment and try again.';
  }

  // Wrong password (Italian backend message: "La password inserita non è corretta!")
  if (
    lowerError.includes('password') &&
    (lowerError.includes('non è corretta') || 
     lowerError.includes('non e corretta') ||
     lowerError.includes('incorrect') ||
     lowerError.includes('not correct'))
  ) {
    return 'The access code you entered is incorrect. Please try again.';
  }

  // Authorization/permission errors
  if (
    lowerError.includes('unauthorized') ||
    lowerError.includes('only admins') ||
    lowerError.includes('assign user roles') ||
    lowerError.includes('access denied')
  ) {
    return 'Access denied. You do not have permission to access this area.';
  }

  // Network/connection errors
  if (
    lowerError.includes('connection') ||
    lowerError.includes('timeout') ||
    lowerError.includes('unreachable')
  ) {
    return 'Unable to connect to the service. Please check your connection and try again.';
  }

  // If we have a non-empty error that doesn't match specific categories,
  // assume it's an authentication failure (wrong code)
  if (rawError && rawError.trim() !== '') {
    return 'Unable to authenticate. Please verify your access code.';
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}
