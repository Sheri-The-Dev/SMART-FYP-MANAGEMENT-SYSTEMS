const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  adminRequestPasswordReset,
  initiateSecurityChallenge,
  getSecurityQuestions,
  verifySecurityAnswers,
  completePasswordReset,
  getAuditLogs,
  getDashboardStats,
  bulkCreateUsers,
  exportWorkloadReport,
  getCapacityAlerts,
  resetWorkload,
  decrementWorkload,
  exportUsers,
  announceResults,
  finalizeBatch
} = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');
const { validationRules, validate } = require('../middleware/validation');
const { uploadCSV, handleUploadError } = require('../middleware/upload');

const { authLimiter } = require('../middleware/rateLimiter');

// Security question challenge (public access with token)
router.get('/security-questions', getSecurityQuestions);
router.post('/verify-security-answers', authLimiter, validationRules.answerSecurityQuestions, validate, verifySecurityAnswers);
router.post('/complete-password-reset', authLimiter, validationRules.resetPassword, validate, completePasswordReset);

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// User management
router.post('/users', validationRules.createUser, validate, createUser);
router.post('/users/bulk-create', uploadCSV.single('csvFile'), handleUploadError, bulkCreateUsers);
router.post('/users/export', exportUsers);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/reset-workload', resetWorkload);
router.put('/users/:id/decrement-workload', decrementWorkload);
router.delete('/users/:id', deleteUser);

// Password reset (admin-initiated)
router.post('/users/:id/request-password-reset', adminRequestPasswordReset);
router.post('/users/:id/initiate-security-challenge', initiateSecurityChallenge);

// Audit and statistics
router.get('/audit-logs', getAuditLogs);
router.get('/dashboard-stats', getDashboardStats);
router.get('/workload-report', exportWorkloadReport);
router.get('/supervisor-alerts', getCapacityAlerts);

// Announce Results Module 10
router.post('/results/announce/:batchId', announceResults);

// Finalize Batch FYP-I -> FYP-II
router.post('/finalize-batch', finalizeBatch);

module.exports = router;