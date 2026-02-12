/**
 * Normalizes backend errors into user-friendly English messages
 */
export function normalizeError(error: unknown): string {
  const rawMessage = extractRawError(error);
  
  // Service availability errors
  if (rawMessage.includes('Actor not available') || 
      rawMessage.includes('SERVICE_UNAVAILABLE') ||
      rawMessage.includes('Backend not available')) {
    return 'Service is temporarily unavailable. Please try again in a moment.';
  }

  // Admin authentication errors
  if (rawMessage.includes('Wrong admin access code')) {
    return 'Incorrect admin access code. Please verify your credentials.';
  }

  if (rawMessage.includes('Admin access required')) {
    return 'Admin access required. Please log in as an administrator.';
  }

  // Admin authorization errors
  if (rawMessage.includes('Unauthorized: Admin access required') || 
      rawMessage.includes('Unauthorized: Only admins')) {
    return 'Admin access required. Please log in as an administrator.';
  }

  // Trainer identity errors
  if (rawMessage.includes('Trainer identity already exists')) {
    return 'Your name has already been registered. You cannot change it at this time.';
  }

  if (rawMessage.includes('No PT code found') || rawMessage.includes('authenticate first')) {
    return 'Please log in again to register your name.';
  }

  if (rawMessage.includes('Only authenticated trainers')) {
    return 'Only trainers can register their name.';
  }

  // Authentication errors
  if (rawMessage.includes('Unauthorized') || rawMessage.includes('authenticated')) {
    return 'You are not authorized to perform this action. Please log in again.';
  }

  // Booking-specific errors
  if (rawMessage.includes('Booking not found')) {
    return 'Booking not found. It may have been deleted.';
  }

  if (rawMessage.includes('Only trainers can')) {
    return 'Only trainers can manage bookings.';
  }

  // Network errors
  if (rawMessage.includes('network') || rawMessage.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Validation errors - pass through as they're already user-friendly
  if (rawMessage.includes('must be') || 
      rawMessage.includes('required') ||
      rawMessage.includes('invalid') ||
      rawMessage.includes('already exists')) {
    return rawMessage;
  }

  // Default fallback
  return rawMessage || 'An unexpected error occurred. Please try again.';
}

/**
 * Extracts the raw error message from various error formats
 */
export function extractRawError(error: unknown): string {
  if (!error) return '';
  
  if (typeof error === 'string') return error;
  
  if (error instanceof Error) return error.message;
  
  if (typeof error === 'object') {
    const err = error as any;
    return err.message || err.error || err.toString();
  }
  
  return String(error);
}

/**
 * Logs detailed error information to console for debugging
 */
export function logErrorDetails(error: unknown, context?: string) {
  const prefix = context ? `[${context}]` : '[Error]';
  
  console.error(`${prefix} Error occurred:`, error);
  
  if (error instanceof Error && error.stack) {
    console.error(`${prefix} Stack trace:`, error.stack);
  }
}
