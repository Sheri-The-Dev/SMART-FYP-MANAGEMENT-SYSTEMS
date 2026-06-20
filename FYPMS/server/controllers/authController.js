const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateJWT, generateResetToken } = require('../utils/tokenGenerator');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../utils/emailService');
const { logAudit, getClientIp, AuditActions } = require('../utils/logger');
const { trackFailedLogin, checkAccountLock, clearFailedAttempts } = require('../middleware/rateLimiter');

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = getClientIp(req);

    // Check for account lock
    const lockStatus = await checkAccountLock(username);
    if (lockStatus.isLocked) {
      await logAudit({
        action: AuditActions.ACCOUNT_LOCKED,
        details: { username, reason: 'Too many failed attempts' },
        ipAddress
      });

      return res.status(403).json({
        success: false,
        message: 'Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.'
      });
    }

    // Find user by username, email, or SAP ID
    const userSql = `
      SELECT id, username, email, sap_id, password_hash, role, is_active, last_login, profile_picture, phone, department,
             temporary_role, temporary_role_expires_at
      FROM users 
      WHERE (username = ? OR email = ? OR sap_id = ?) AND is_active = true
    `;

    const [user] = await query(userSql, [username, username, username]);

    if (!user) {
      await trackFailedLogin(username, ipAddress);
      await logAudit({
        action: AuditActions.LOGIN_FAILED,
        details: { username, reason: 'User not found' },
        ipAddress
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      await trackFailedLogin(username, ipAddress);
      await logAudit({
        userId: user.id,
        action: AuditActions.LOGIN_FAILED,
        details: { username, reason: 'Invalid password' },
        ipAddress
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
        remainingAttempts: lockStatus.remainingAttempts - 1
      });
    }

    // Clear failed attempts
    await clearFailedAttempts(username);

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      sap_id: user.sap_id,
      temporary_role: user.temporary_role,
      temporary_role_expires_at: user.temporary_role_expires_at
    };

    const token = generateJWT(tokenPayload);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create session
    const sessionSql = `
      INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `;

    await query(sessionSql, [
      user.id,
      token,
      expiresAt,
      ipAddress,
      req.headers['user-agent'] || 'unknown'
    ]);

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Log successful login
    await logAudit({
      userId: user.id,
      action: AuditActions.LOGIN_SUCCESS,
      details: { username: user.username },
      ipAddress
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          sap_id: user.sap_id,
          phone: user.phone,
          department: user.department,
          profile_picture: user.profile_picture,
          temporary_role: user.temporary_role,
          temporary_role_expires_at: user.temporary_role_expires_at
        },
        expiresAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login.',
      error: error.message
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    const ipAddress = getClientIp(req);

    if (token) {
      // Delete session
      await query('DELETE FROM sessions WHERE token = ?', [token]);

      // Log logout
      await logAudit({
        userId: req.user?.id,
        action: AuditActions.LOGOUT,
        details: { username: req.user?.username },
        ipAddress
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout.',
      error: error.message
    });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const ipAddress = getClientIp(req);

    // Find user by email
    const userSql = 'SELECT id, username, email FROM users WHERE email = ? AND is_active = true';
    const [user] = await query(userSql, [email]);

    // Always return success message to prevent email enumeration
    const successMessage = 'If an account exists with that email, you will receive password reset instructions.';

    if (!user) {
      await logAudit({
        action: AuditActions.PASSWORD_RESET_REQUESTED,
        details: { email, result: 'Email not found' },
        ipAddress
      });

      return res.status(200).json({
        success: true,
        message: successMessage
      });
    }

    // Generate reset token
    const { token, expiresAt } = generateResetToken();

    // Save token to database
    const tokenSql = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `;
    await query(tokenSql, [user.id, token, expiresAt]);

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, user.username, token);

      await logAudit({
        userId: user.id,
        action: AuditActions.PASSWORD_RESET_REQUESTED,
        details: { email: user.email },
        ipAddress
      });

    } catch (emailError) {
      console.error('Email send error:', emailError);
      // Continue - don't reveal email sending failure
    }

    res.status(200).json({
      success: true,
      message: successMessage
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred. Please try again later.',
      error: error.message
    });
  }
};

// Validate reset token
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required.'
      });
    }

    // Check if token exists and is valid
    const tokenSql = `
      SELECT t.*, u.email, u.username
      FROM password_reset_tokens t
      JOIN users u ON t.user_id = u.id
      WHERE t.token = ? AND t.used = false AND t.expires_at > NOW()
    `;

    const [tokenData] = await query(tokenSql, [token]);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        email: tokenData.email,
        username: tokenData.username
      }
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred validating the token.',
      error: error.message
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const ipAddress = getClientIp(req);

    // Validate token
    const tokenSql = `
      SELECT t.*, u.id as user_id, u.email, u.username
      FROM password_reset_tokens t
      JOIN users u ON t.user_id = u.id
      WHERE t.token = ? AND t.used = false AND t.expires_at > NOW()
    `;

    const [tokenData] = await query(tokenSql, [token]);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.'
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS));

    // Update password
    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, tokenData.user_id]
    );

    // Mark token as used
    await query('UPDATE password_reset_tokens SET used = true WHERE token = ?', [token]);

    // Invalidate all existing sessions for this user
    await query('DELETE FROM sessions WHERE user_id = ?', [tokenData.user_id]);

    // Log password reset
    await logAudit({
      userId: tokenData.user_id,
      action: AuditActions.PASSWORD_RESET_COMPLETED,
      details: { method: 'email', username: tokenData.username },
      ipAddress
    });

    // Send confirmation email
    try {
      await sendPasswordChangedEmail(tokenData.email, tokenData.username);
    } catch (emailError) {
      console.error('Confirmation email error:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred resetting your password.',
      error: error.message
    });
  }
};

// Change password (authenticated user)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const ipAddress = getClientIp(req);

    // Get current password hash
    const [user] = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.'
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS));

    // Update password
    await query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, userId]
    );

    // Log password change
    await logAudit({
      userId,
      action: AuditActions.PASSWORD_CHANGED,
      details: { username: req.user.username },
      ipAddress
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred changing your password.',
      error: error.message
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userSql = `
      SELECT id, username, email, role, created_at, last_login, profile_picture
      FROM users 
      WHERE id = ?
    `;

    const [user] = await query(userSql, [userId]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred retrieving your profile.',
      error: error.message
    });
  }
};

module.exports = {
  login,
  logout,
  requestPasswordReset,
  validateResetToken,
  resetPassword,
  changePassword,
  getProfile
};
