const { body, validationResult } = require('express-validator');

// Password policy validation
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true
};

// Validate password against policy
const validatePassword = (password) => {
  const errors = [];

  if (password.length < passwordPolicy.minLength) {
    errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
  }

  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (passwordPolicy.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (passwordPolicy.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation rules for different endpoints
const validationRules = {
  login: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username or email is required')
      .isLength({ max: 255 })
      .withMessage('Username too long'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  requestPasswordReset: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail()
  ],

  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .custom((value) => {
        const validation = validatePassword(value);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
        return true;
      })
  ],

  createUser: [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be 3-50 characters')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Username can only contain letters, numbers, hyphens, and underscores'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn(['Student', 'Teacher', 'Committee', 'Administrator'])
      .withMessage('Invalid role'),
    body('password')
      .optional()
      .custom((value) => {
        if (value) {
          const validation = validatePassword(value);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }
        }
        return true;
      })
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .custom((value, { req }) => {
        if (value === req.body.currentPassword) {
          throw new Error('New password must be different from current password');
        }
        const validation = validatePassword(value);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
        return true;
      })
  ],

  answerSecurityQuestions: [
    body('answers')
      .isArray({ min: 1 })
      .withMessage('At least one security answer is required'),
    body('answers.*.questionId')
      .notEmpty()
      .withMessage('Question ID is required'),
    body('answers.*.answer')
      .notEmpty()
      .withMessage('Answer is required')
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Name must be 3-100 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Invalid email format')
      .normalizeEmail(),
    body('phone')
      .optional()
      .trim()
      .matches(/^[0-9+\-\s()]*$/)
      .withMessage('Invalid phone number format'),
    body('department')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Department name too long'),
    body('research_areas')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Research areas description too long'),
    body('expertise')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Expertise description too long'),
    body('availability_status')
      .optional()
      .isIn(['Available', 'Busy', 'Unavailable'])
      .withMessage('Invalid availability status')
  ]
};

// Middleware to check validation results
const validate = (req, res, next) => {
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
};

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
};

module.exports = {
  validationRules,
  validate,
  validatePassword,
  passwordPolicy,
  sanitizeInput
};