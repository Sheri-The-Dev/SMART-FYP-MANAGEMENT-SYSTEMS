const { body, param, validationResult } = require('express-validator');

// ============================================
// PROPOSAL VALIDATION MIDDLEWARE
// ============================================
// Purpose: Validate all proposal-related requests
// Used in: routes/proposal.js
// ============================================

const proposalValidation = {
  
  // ============================================
  // CREATE PROPOSAL VALIDATION
  // ============================================
  create: [
    body('project_title')
      .trim()
      .notEmpty().withMessage('Project title is required')
      .isLength({ min: 10, max: 500 }).withMessage('Title must be between 10 and 500 characters')
      .matches(/^[a-zA-Z0-9\s\-:,.\(\)&]+$/).withMessage('Title contains invalid characters'),
    
    body('project_description')
      .trim()
      .notEmpty().withMessage('Project description is required')
      .isLength({ min: 50, max: 5000 }).withMessage('Description must be between 50 and 5000 characters'),
    
    body('supervisor_id')
      .optional({ nullable: true })
      .isInt({ min: 1 }).withMessage('Invalid supervisor ID'),
    
    body('members')
      .isArray({ min: 1, max: 10 }).withMessage('At least 1 and maximum 10 group members allowed'),
    
    body('members.*.sap_id')
      .trim()
      .notEmpty().withMessage('SAP ID is required for all members')
      .isLength({ min: 3, max: 20 }).withMessage('SAP ID must be between 3 and 20 characters')
      .matches(/^[a-zA-Z0-9\-]+$/).withMessage('SAP ID can only contain letters, numbers, and hyphens'),
    
    body('members.*.email')
      .trim()
      .notEmpty().withMessage('Email is required for all members')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('members.*.phone_number')
      .optional({ nullable: true })
      .trim()
      .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number format'),
    
    // Custom validation middleware
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        });
      }
      next();
    }
  ],

  // ============================================
  // UPDATE PROPOSAL VALIDATION
  // ============================================
  update: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID'),
    
    body('project_title')
      .optional()
      .trim()
      .isLength({ min: 10, max: 500 }).withMessage('Title must be between 10 and 500 characters')
      .matches(/^[a-zA-Z0-9\s\-:,.\(\)&]+$/).withMessage('Title contains invalid characters'),
    
    body('project_description')
      .optional()
      .trim()
      .isLength({ min: 50, max: 5000 }).withMessage('Description must be between 50 and 5000 characters'),
    
    body('supervisor_id')
      .optional({ nullable: true })
      .isInt({ min: 1 }).withMessage('Invalid supervisor ID'),
    
    body('members')
      .optional()
      .isArray({ min: 1, max: 10 }).withMessage('At least 1 and maximum 10 group members allowed'),
    
    body('members.*.sap_id')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 }).withMessage('SAP ID must be between 3 and 20 characters')
      .matches(/^[a-zA-Z0-9\-]+$/).withMessage('SAP ID can only contain letters, numbers, and hyphens'),
    
    body('members.*.email')
      .optional()
      .trim()
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    
    body('members.*.phone_number')
      .optional({ nullable: true })
      .trim()
      .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number format'),
    
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        });
      }
      next();
    }
  ],

  // ============================================
  // SUPERVISOR FEEDBACK VALIDATION
  // ============================================
  feedback: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID'),
    
    body('feedback')
      .trim()
      .notEmpty().withMessage('Feedback is required')
      .isLength({ min: 20, max: 2000 }).withMessage('Feedback must be between 20 and 2000 characters'),
    
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg
          }))
        });
      }
      next();
    }
  ],

  // ============================================
  // PROPOSAL ID VALIDATION (for generic routes)
  // ============================================
  proposalId: [
    param('id')
      .isInt({ min: 1 }).withMessage('Invalid proposal ID'),
    
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid proposal ID'
        });
      }
      next();
    }
  ]
};

module.exports = { proposalValidation };