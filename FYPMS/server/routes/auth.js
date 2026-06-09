const express = require('express');
const router = express.Router();
const {
  login,
  logout,
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  changePassword,
  getProfile
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validationRules, validate } = require('../middleware/validation');
const { authLimiter, resetLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/login', authLimiter, validationRules.login, validate, login);
router.post('/request-password-reset', resetLimiter, validationRules.requestPasswordReset, validate, requestPasswordReset);
router.get('/validate-reset-token', validateResetToken);
router.post('/reset-password', validationRules.resetPassword, validate, resetPassword);

// Protected routes (require authentication)
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, validationRules.changePassword, validate, changePassword);
router.get('/profile', authenticate, getProfile);

module.exports = router;