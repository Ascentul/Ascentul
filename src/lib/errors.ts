/**
 * Type-safe error handling utilities
 *
 * These utilities help handle errors in a type-safe way without using `any`
 */

/**
 * Extract error message from unknown error type
 *
 * @param error - The caught error (unknown type)
 * @param fallback - Fallback message if error message can't be extracted
 * @returns The error message as a string
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error: unknown) {
 *   const message = getErrorMessage(error);
 *   console.error(message);
 * }
 * ```
 */
export function getErrorMessage(error: unknown, fallback = 'An unknown error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

/**
 * Check if error is an instance of Error
 * Type guard for Error objects
 *
 * @param error - The value to check
 * @returns True if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Convert unknown error to Error instance
 * Useful for ensuring you have an Error object with stack trace
 *
 * @param error - The caught error
 * @returns An Error instance
 */
export function toError(error: unknown): Error {
  if (isError(error)) {
    return error;
  }

  if (typeof error === 'string') {
    return new Error(error);
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string') {
      return new Error(message);
    }
  }

  return new Error('An unknown error occurred');
}
