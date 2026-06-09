import { PASSWORD_POLICY } from './constants';

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
  const errors = [];

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`At least ${PASSWORD_POLICY.minLength} characters required`);
  }

  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('One uppercase letter required');
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('One lowercase letter required');
  }

  if (PASSWORD_POLICY.requireNumber && !/\d/.test(password)) {
    errors.push('One number required');
  }

  if (PASSWORD_POLICY.requireSpecialChar && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('One special character required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Calculate password strength (0-100)
export const calculatePasswordStrength = (password) => {
  let strength = 0;

  if (password.length >= 8) strength += 25;
  if (password.length >= 12) strength += 10;
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/\d/.test(password)) strength += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 20;

  return Math.min(strength, 100);
};

// Get password strength label
export const getPasswordStrengthLabel = (strength) => {
  if (strength < 30) return { label: 'Weak', color: '#ef4444' };
  if (strength < 60) return { label: 'Fair', color: '#f59e0b' };
  if (strength < 80) return { label: 'Good', color: '#3b82f6' };
  return { label: 'Strong', color: '#10b981' };
};

// Username validation
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,50}$/;
  return usernameRegex.test(username);
};

// Sanitize input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>]/g, '').trim();
};