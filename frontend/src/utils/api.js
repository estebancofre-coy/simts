/**
 * API utilities for SimTS frontend.
 * 
 * Provides:
 * - Fetch wrapper with timeout
 * - Retry logic with exponential backoff
 * - Error handling for rate limits and service unavailable
 */

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with timeout
 */
export const fetchWithTimeout = async (url, options = {}, timeout = DEFAULT_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

/**
 * Calculate exponential backoff delay
 */
const calculateBackoff = (attempt, baseDelay = INITIAL_RETRY_DELAY) => {
  return baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
};

/**
 * Check if error is retryable
 */
const isRetryable = (error, response) => {
  // Network errors are retryable
  if (error && !response) {
    return true;
  }

  // Retry on specific status codes
  if (response) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(response.status);
  }

  return false;
};

/**
 * Get retry delay from response headers (for 429 rate limit)
 */
const getRetryDelay = (response) => {
  if (!response) return null;

  // Check Retry-After header
  const retryAfter = response.headers.get('Retry-After');
  if (retryAfter) {
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) {
      return seconds * 1000;
    }
  }

  return null;
};

/**
 * Fetch with retry logic and exponential backoff
 */
export const fetchWithRetry = async (
  url,
  options = {},
  maxRetries = MAX_RETRIES,
  timeout = DEFAULT_TIMEOUT
) => {
  let lastError = null;
  let lastResponse = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeout);
      
      // If successful, return response
      if (response.ok) {
        return response;
      }

      lastResponse = response;

      // Check if we should retry
      if (attempt < maxRetries && isRetryable(null, response)) {
        // Get retry delay from headers or use exponential backoff
        let delay = getRetryDelay(response);
        if (!delay) {
          delay = calculateBackoff(attempt);
        }

        console.warn(`Request failed with status ${response.status}. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      // Not retryable or max retries reached
      return response;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt < maxRetries && isRetryable(error, null)) {
        const delay = calculateBackoff(attempt);
        console.warn(`Request failed: ${error.message}. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }

      // Max retries reached or not retryable
      throw error;
    }
  }

  // If we get here, we've exhausted retries
  if (lastResponse) {
    return lastResponse;
  }
  
  throw lastError || new Error('Request failed after retries');
};

/**
 * Enhanced fetch with all features
 */
export const apiFetch = async (url, options = {}) => {
  const {
    retry = true,
    maxRetries = MAX_RETRIES,
    timeout = DEFAULT_TIMEOUT,
    ...fetchOptions
  } = options;

  // Add default headers
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers
  };

  const finalOptions = {
    ...fetchOptions,
    headers
  };

  // Use retry logic if enabled
  if (retry) {
    const response = await fetchWithRetry(url, finalOptions, maxRetries, timeout);
    return await handleResponse(response);
  }

  // No retry
  const response = await fetchWithTimeout(url, finalOptions, timeout);
  return await handleResponse(response);
};

/**
 * Handle API response
 */
const handleResponse = async (response) => {
  // Handle rate limiting
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const message = retryAfter
      ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
      : 'Rate limit exceeded. Please try again later.';
    
    const error = new Error(message);
    error.status = 429;
    error.retryAfter = retryAfter;
    throw error;
  }

  // Handle service unavailable
  if (response.status === 503) {
    const error = new Error('Service temporarily unavailable. Please try again later.');
    error.status = 503;
    throw error;
  }

  // Handle other HTTP errors
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const data = await response.json();
      errorMessage = data.detail || data.message || errorMessage;
    } catch (e) {
      // Response is not JSON, use default message
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.response = response;
    throw error;
  }

  return response;
};

/**
 * Helper for GET requests
 */
export const apiGet = async (url, options = {}) => {
  const response = await apiFetch(url, {
    ...options,
    method: 'GET'
  });
  return await response.json();
};

/**
 * Helper for POST requests
 */
export const apiPost = async (url, data, options = {}) => {
  const response = await apiFetch(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  });
  return await response.json();
};

/**
 * Helper for PUT requests
 */
export const apiPut = async (url, data, options = {}) => {
  const response = await apiFetch(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return await response.json();
};

/**
 * Helper for DELETE requests
 */
export const apiDelete = async (url, options = {}) => {
  const response = await apiFetch(url, {
    ...options,
    method: 'DELETE'
  });
  return await response.json();
};

/**
 * Get API base URL with validation
 */
export const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  if (!apiUrl) {
    // Generic error message for production security
    if (import.meta.env.MODE === 'production') {
      throw new Error('API configuration error. Please contact support.');
    } else {
      // More detailed error in development
      console.error('VITE_API_URL not configured');
      throw new Error('Backend URL not configured. Set VITE_API_URL in .env');
    }
  }
  
  return apiUrl;
};
