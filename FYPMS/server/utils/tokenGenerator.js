const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate secure random token
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate JWT token
const generateJWT = (payload, expiresIn = process.env.JWT_EXPIRE) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Verify JWT token
const verifyJWT = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Generate password reset token with expiry
const generateResetToken = () => {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRE));
  return { token, expiresAt };
};

// Generate security question challenge token
const generateChallengeToken = () => {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + parseInt(process.env.SECURITY_CHALLENGE_TOKEN_EXPIRE));
  return { token, expiresAt };
};

module.exports = {
  generateSecureToken,
  generateJWT,
  verifyJWT,
  generateResetToken,
  generateChallengeToken
};