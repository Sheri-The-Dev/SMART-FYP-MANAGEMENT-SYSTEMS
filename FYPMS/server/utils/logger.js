const { query } = require('../config/database');

// Log audit trail
const logAudit = async ({
  userId = null,
  adminId = null,
  action,
  entityType = null,
  entityId = null,
  details = null,
  ipAddress = null
}) => {
  try {
    const sql = `
      INSERT INTO audit_logs 
      (user_id, admin_id, action, entity_type, entity_id, details, ip_address) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const detailsJson = details ? JSON.stringify(details) : null;
    
    await query(sql, [
      userId,
      adminId,
      action,
      entityType,
      entityId,
      detailsJson,
      ipAddress
    ]);
    
    return true;
  } catch (error) {
    console.error('Audit log error:', error.message);
    // Don't throw - logging failure shouldn't break the main operation
    return false;
  }
};

// Get client IP address from request
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.connection.socket?.remoteAddress ||
         'unknown';
};

const AuditActions = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  
  // Password Management
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  
  // User Management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_DISABLED: 'USER_DISABLED',
  USER_ENABLED: 'USER_ENABLED',
  
  // Admin Actions
  ADMIN_PASSWORD_RESET_INITIATED: 'ADMIN_PASSWORD_RESET_INITIATED',
  ADMIN_SECURITY_CHALLENGE_SENT: 'ADMIN_SECURITY_CHALLENGE_SENT',
  ADMIN_PASSWORD_RESET_COMPLETED: 'ADMIN_PASSWORD_RESET_COMPLETED',
  BATCH_FINALIZED: 'BATCH_FINALIZED',
  
  // Security
  SECURITY_QUESTION_VERIFIED: 'SECURITY_QUESTION_VERIFIED',
  SECURITY_QUESTION_FAILED: 'SECURITY_QUESTION_FAILED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',

  // Profile
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  PROFILE_PICTURE_UPDATED: 'PROFILE_PICTURE_UPDATED',
  PROFILE_PICTURE_DELETED: 'PROFILE_PICTURE_DELETED',

  // Proposal
  PROPOSAL_CREATED: 'PROPOSAL_CREATED',
  PROPOSAL_UPDATED: 'PROPOSAL_UPDATED',
  PROPOSAL_SUBMITTED: 'PROPOSAL_SUBMITTED',
  PROPOSAL_APPROVED: 'PROPOSAL_APPROVED',
  PROPOSAL_REJECTED: 'PROPOSAL_REJECTED',
  PROPOSAL_REVISION_REQUESTED: 'PROPOSAL_REVISION_REQUESTED',
  PROPOSAL_DELETED: 'PROPOSAL_DELETED',
  PROPOSAL_PDF_UPLOADED: 'PROPOSAL_PDF_UPLOADED',

  // Supervision Capacity
  CAPACITY_REACHED: 'CAPACITY_REACHED',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED'
};

// ============================================
// CRITICAL FIX: Add logActivity function
// ============================================
// This function is called by projectController.js but was missing!
// Without this function, ALL project operations (create, update, delete) will fail
const logActivity = async (
  userId,
  action,
  entityType = null,
  entityId = null,
  oldData = null,
  newData = null
) => {
  try {
    const details = {};
    if (oldData) details.oldData = oldData;
    if (newData) details.newData = newData;

    return await logAudit({
      userId,
      action,
      entityType,
      entityId,
      details: Object.keys(details).length > 0 ? details : null
    });
  } catch (error) {
    console.error('Activity log error:', error.message);
    // Don't throw - logging failure shouldn't break the main operation
    return false;
  }
};

module.exports = {
  logAudit,
  logActivity,  // ← ADDED: This was missing and causing all project operations to fail
  getClientIp,
  AuditActions
};