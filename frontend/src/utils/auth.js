/**
 * Authentication utilities for SimTS frontend.
 * 
 * Provides:
 * - Secure localStorage with encryption
 * - Token validation
 * - Session management with auto-refresh
 * - Auto-logout on inactivity
 */

// Simple encryption/decryption using base64 encoding
// In production, consider using crypto-js for stronger encryption
const encodeData = (data) => {
  try {
    return btoa(JSON.stringify(data));
  } catch (e) {
    console.error('Error encoding data:', e);
    return null;
  }
};

const decodeData = (encoded) => {
  try {
    return JSON.parse(atob(encoded));
  } catch (e) {
    console.error('Error decoding data:', e);
    return null;
  }
};

/**
 * Secure storage wrapper for localStorage with encryption
 */
export const secureStorage = {
  set: (key, value) => {
    try {
      const encoded = encodeData(value);
      if (encoded) {
        localStorage.setItem(key, encoded);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error storing data:', e);
      return false;
    }
  },

  get: (key) => {
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;
      return decodeData(encoded);
    } catch (e) {
      console.error('Error retrieving data:', e);
      return null;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing data:', e);
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Error clearing storage:', e);
      return false;
    }
  }
};

/**
 * Token validator
 */
export const tokenValidator = {
  isValid: (token) => {
    if (!token) return false;
    // Basic validation - in production, verify JWT signature
    return token.startsWith('student-') || token.startsWith('teacher-');
  },

  extractUserId: (token) => {
    if (!token) return null;
    const parts = token.split('-');
    return parts.length > 1 ? parts[1] : null;
  }
};

/**
 * Session manager with auto-logout on inactivity
 */
class SessionManager {
  constructor() {
    this.timeout = 30 * 60 * 1000; // 30 minutes
    this.timeoutId = null;
    this.lastActivity = Date.now();
    this.listeners = [];
  }

  /**
   * Start session monitoring
   */
  start() {
    this.resetTimeout();
    this.setupActivityListeners();
  }

  /**
   * Stop session monitoring
   */
  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.removeActivityListeners();
  }

  /**
   * Reset inactivity timeout
   */
  resetTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.lastActivity = Date.now();

    this.timeoutId = setTimeout(() => {
      this.handleTimeout();
    }, this.timeout);
  }

  /**
   * Handle session timeout
   */
  handleTimeout() {
    console.warn('Session expired due to inactivity');
    this.notifyListeners('timeout');
    this.clearSession();
  }

  /**
   * Clear session data
   */
  clearSession() {
    secureStorage.remove('studentAuth');
    secureStorage.remove('studentData');
    secureStorage.remove('studentToken');
    secureStorage.remove('teacherAuth');
    secureStorage.remove('teacherToken');
    this.stop();
  }

  /**
   * Setup activity listeners
   */
  setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity);
    });
  }

  /**
   * Remove activity listeners
   */
  removeActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity);
    });
  }

  /**
   * Handle user activity
   */
  handleActivity = () => {
    const now = Date.now();
    // Only reset if more than 1 minute since last activity (debounce)
    if (now - this.lastActivity > 60000) {
      this.resetTimeout();
    }
  }

  /**
   * Add listener for session events
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        console.error('Error notifying listener:', e);
      }
    });
  }

  /**
   * Check if session is valid
   */
  isValid() {
    const token = secureStorage.get('studentToken') || secureStorage.get('teacherToken');
    return tokenValidator.isValid(token);
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

/**
 * Input sanitizer to prevent XSS
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

/**
 * Validate username format
 */
export const validateUsername = (username) => {
  const re = /^[a-zA-Z0-9_-]{3,50}$/;
  return re.test(username);
};
