// Color scheme
export const COLORS = {
  primary: '#193869',
  secondary: '#d29538',
  complimentary: '#234e92',
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

// User roles
export const ROLES = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  COMMITTEE: 'Committee',
  ADMINISTRATOR: 'Administrator'
};

// Departments
export const DEPARTMENTS = [
  'Artificial Intelligence',
  'Software Engineering',
  'Computer Science',
  'Cyber Security',
  'Data Science'
];

// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Password policy
export const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
};

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'user_data'
};

// ADD THESE NEW CONSTANTS:
export const AVAILABILITY_STATUS = {
  AVAILABLE: 'Available',
  BUSY: 'Busy',
  UNAVAILABLE: 'Unavailable'
};

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  UPLOAD_URL: '/profile/picture'
};

// Proposal constants
export const PROPOSAL_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISION_REQUESTED: 'revision_requested'
};

export const PROPOSAL_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  revision_requested: 'Revision Required'
};

export const PROPOSAL_STATUS_COLORS = {
  draft: 'gray',
  submitted: 'blue',
  approved: 'green',
  rejected: 'red',
  revision_requested: 'orange'
};

export const PROPOSAL_VALIDATION = {
  TITLE_MIN_LENGTH: 10,
  TITLE_MAX_LENGTH: 500,
  DESCRIPTION_MIN_LENGTH: 50,
  DESCRIPTION_MAX_LENGTH: 5000,
  MIN_MEMBERS: 1,
  MAX_MEMBERS: 10,
  PDF_MAX_SIZE: 10 * 1024 * 1024 // 10MB
};