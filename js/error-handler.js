// Error Handler - Handles retry logic and error management
// Provides exponential backoff retry and error handling utilities

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
 * @returns {Promise} Result of the function or throws error after all retries
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Try to execute the function
      const result = await fn();
      
      // If successful, return the result
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} succeeded`);
      }
      return result;
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error(`All ${maxRetries + 1} attempts failed:`, error);
        throw error;
      }

      // Calculate delay with exponential backoff: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);
      
      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but just in case
  throw lastError;
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handle API errors with fallback data
 * @param {Error} error - The error that occurred
 * @param {*} fallbackData - Fallback data to return if available
 * @param {string} context - Context description for logging
 * @returns {*} Fallback data or empty array
 */
export function handleApiError(error, fallbackData = null, context = 'API call') {
  console.error(`Error in ${context}:`, error);

  // If we have fallback data, use it
  if (fallbackData !== null && fallbackData !== undefined) {
    console.log(`Using fallback data for ${context}`);
    return fallbackData;
  }

  // Return empty array as safe default
  console.warn(`No fallback data available for ${context}, returning empty array`);
  return [];
}

/**
 * Check if an error is a network error
 * @param {Error} error - The error to check
 * @returns {boolean} True if it's a network error
 */
export function isNetworkError(error) {
  return (
    error instanceof TypeError ||
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('Failed to fetch')
  );
}

/**
 * Check if an error is a rate limit error
 * @param {Error} error - The error to check
 * @returns {boolean} True if it's a rate limit error
 */
export function isRateLimitError(error) {
  return (
    error.message.includes('rate limit') ||
    error.message.includes('429') ||
    error.message.includes('too many requests')
  );
}

/**
 * Format error message for user display
 * @param {Error} error - The error to format
 * @param {string} context - Context description
 * @returns {string} User-friendly error message
 */
export function formatErrorMessage(error, context = '') {
  if (isNetworkError(error)) {
    return 'Network connection issue. Using cached data if available.';
  }

  if (isRateLimitError(error)) {
    return 'API rate limit reached. Please try again later.';
  }

  // Generic error message
  return context 
    ? `Unable to load ${context}. Some projects may be unavailable.`
    : 'An error occurred. Some projects may be unavailable.';
}
