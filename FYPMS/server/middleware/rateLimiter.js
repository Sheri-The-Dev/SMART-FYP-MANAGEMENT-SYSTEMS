const rateLimit = require('express-rate-limit');
const { query } = require('../config/database');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200000, // Limit each IP to 200,000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },
  skipSuccessfulRequests: true, // Don't count successful logins
  standardHeaders: true,
  legacyHeaders: false
});

// Password reset request limiter
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Track failed login attempts in database
const trackFailedLogin = async (identifier, ipAddress) => {
  try {
    const sql = `
      INSERT INTO failed_login_attempts (identifier, ip_address)
      VALUES (?, ?)
    `;
    await query(sql, [identifier, ipAddress]);

    // Clean up old attempts (older than 24 hours)
    const cleanupSql = `
      DELETE FROM failed_login_attempts 
      WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    await query(cleanupSql);

  } catch (error) {
    console.error('Failed to track login attempt:', error);
  }
};

// Check if account should be locked due to failed attempts
const checkAccountLock = async (identifier) => {
  try {
    const sql = `
      SELECT COUNT(*) as attemptCount
      FROM failed_login_attempts
      WHERE identifier = ? 
      AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
    `;
    
    const [result] = await query(sql, [identifier]);
    const attemptCount = result?.attemptCount || 0;

    // Lock account after 5 failed attempts in 15 minutes
    return {
      isLocked: attemptCount >= 5,
      attemptCount,
      remainingAttempts: Math.max(0, 5 - attemptCount)
    };
  } catch (error) {
    console.error('Failed to check account lock:', error);
    return { isLocked: false, attemptCount: 0, remainingAttempts: 5 };
  }
};

// Clear failed login attempts after successful login
const clearFailedAttempts = async (identifier) => {
  try {
    const sql = `
      DELETE FROM failed_login_attempts 
      WHERE identifier = ?
    `;
    await query(sql, [identifier]);
  } catch (error) {
    console.error('Failed to clear login attempts:', error);
  }
};

module.exports = {
  generalLimiter,
  authLimiter,
  resetLimiter,
  trackFailedLogin,
  checkAccountLock,
  clearFailedAttempts
};