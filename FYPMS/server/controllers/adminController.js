const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { generateResetToken, generateChallengeToken, generateSecureToken } = require('../utils/tokenGenerator');
const { sendAccountCreationEmail, sendPasswordResetEmail, sendSecurityChallengeEmail } = require('../utils/emailService');
const { logAudit, getClientIp, AuditActions } = require('../utils/logger');

// Create new user (Admin only)
const createUser = async (req, res) => {
  try {
    const { username, email, role, password, sendEmail, department, sap_id } = req.body;
    const adminId = req.user.id;
    const ipAddress = getClientIp(req);

    // For other roles, department is optional but supported
    // Validate sap_id for everyone

    // Check if username already exists
    const [existingUser] = await query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists.'
      });
    }

    if (!sap_id || !/^\d+$/.test(String(sap_id))) {
      return res.status(400).json({
        success: false,
        message: 'SAP ID must be a numeric value.'
      });
    }

    // Generate temporary password if not provided
    const temporaryPassword = password || generateSecureToken(12);
    const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(temporaryPassword, bcryptRounds);

    // Default max supervisees for teachers
    const maxSupervisees = req.body.max_supervisees || 5;

    // Create user
    const userSql = `
      INSERT INTO users (username, email, sap_id, password_hash, role, department, created_by, max_supervisees)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await query(userSql, [
      username || null,
      email || null,
      sap_id || null,
      passwordHash,
      role || null,
      department || null,
      adminId || null,
      role === 'Teacher' ? (maxSupervisees || 5) : null
    ]);
    const newUserId = result.insertId;

    // Log user creation
    await logAudit({
      userId: newUserId,
      adminId,
      action: AuditActions.USER_CREATED,
      entityType: 'user',
      entityId: newUserId,
      details: { username, email, sap_id, role, department, max_supervisees: role === 'Teacher' ? maxSupervisees : undefined },
      ipAddress
    });

    // Send account creation email if requested
    if (sendEmail) {
      try {
        await sendAccountCreationEmail(email, username, sap_id, temporaryPassword, department);
      } catch (emailError) {
        console.error('Account creation email error:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUserId,
        username,
        email,
        sap_id,
        role,
        department,
        temporaryPassword: sendEmail ? undefined : temporaryPassword
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred creating the user.'
    });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        u.id, u.username, u.email, u.sap_id, u.role, u.department, u.is_active, 
        u.created_at, u.last_login,
        creator.username as created_by_username
      FROM users u
      LEFT JOIN users creator ON u.created_by = creator.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by role
    if (role && role !== 'all') {
      sql += ' AND u.role = ?';
      params.push(role);
    }

    // Filter by department
    if (req.query.department && req.query.department !== 'all') {
      sql += ' AND u.department = ?';
      params.push(req.query.department);
    }

    // Search by username, email, or SAP ID
    if (search) {
      sql += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.sap_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await query(countSql, params);
    const total = countResult?.total || 0;

    // Add pagination
    sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const users = await query(sql, params);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred retrieving users.'
    });
  }
};

// Get user by ID (Admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const userSql = `
      SELECT 
        u.id, u.username, u.email, u.role, u.department, u.is_active, 
        u.created_at, u.last_login, u.updated_at,
        creator.username as created_by_username,
        (SELECT COUNT(*) FROM security_questions WHERE user_id = u.id) as has_security_questions
      FROM users u
      LEFT JOIN users creator ON u.created_by = creator.id
      WHERE u.id = ?
    `;

    const [user] = await query(userSql, [id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Get recent activity
    const activitySql = `
      SELECT action, details, created_at, ip_address
      FROM audit_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const activities = await query(activitySql, [id]);

    res.status(200).json({
      success: true,
      data: {
        ...user,
        recentActivity: activities
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred retrieving the user.'
    });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, is_active, department, password } = req.body;
    const adminId = req.user.id;
    const ipAddress = getClientIp(req);

    // Check if user exists
    const [user] = await query('SELECT username, role FROM users WHERE id = ?', [id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Prevent admin from disabling themselves
    if (id == adminId && is_active === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot disable your own account.'
      });
    }

    // Check if email is already taken by another user
    if (email) {
      const [existingEmail] = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists.'
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (email) {
      updates.push('email = ?');
      params.push(email);
    }

    if (role) {
      updates.push('role = ?');
      params.push(role);
    }

    if (typeof is_active !== 'undefined') {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));
      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    // Handle department and max_supervisees update
    // Allow updating department/max_supervisees if role is Teacher OR if we are changing role to Teacher
    const effectiveRole = role || user.role;
    if (effectiveRole === 'Teacher') {
      if (department !== undefined) {
        updates.push('department = ?');
        params.push(department);
      }
      if (req.body.max_supervisees !== undefined) {
        updates.push('max_supervisees = ?');
        params.push(req.body.max_supervisees);
      }
    } else {
      if (department !== undefined) {
        updates.push('department = ?');
        params.push(department);
      }
      if (req.body.max_supervisees !== undefined && effectiveRole === 'Teacher') {
        updates.push('max_supervisees = ?');
        params.push(req.body.max_supervisees);
      } else if (effectiveRole !== 'Teacher' && role) {
        updates.push('max_supervisees = NULL');
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update.'
      });
    }

    updates.push('updated_at = NOW()');
    params.push(id);

    const updateSql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await query(updateSql, params);

    // Log update
    await logAudit({
      userId: id,
      adminId,
      action: AuditActions.USER_UPDATED,
      entityType: 'user',
      entityId: id,
      details: { username: user.username, changes: { email, role, is_active, department, passwordChanged: !!password } },
      ipAddress
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred updating the user.'
    });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ipAddress = getClientIp(req);

    // Prevent admin from deleting themselves
    if (id == adminId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    // Get user info before deletion
    const [user] = await query('SELECT username, email FROM users WHERE id = ?', [id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Delete user (cascade will handle related records)
    await query('DELETE FROM users WHERE id = ?', [id]);

    // Log deletion
    await logAudit({
      adminId,
      action: AuditActions.USER_DELETED,
      entityType: 'user',
      entityId: id,
      details: { username: user.username, email: user.email },
      ipAddress
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred deleting the user.'
    });
  }
};

// Admin-initiated password reset via email
const adminRequestPasswordReset = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ipAddress = getClientIp(req);

    // Get user info
    const [user] = await query(
      'SELECT username, email FROM users WHERE id = ? AND is_active = true',
      [id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive.'
      });
    }

    // Generate reset token
    const { token, expiresAt } = generateResetToken();

    // Save token
    const tokenSql = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `;
    await query(tokenSql, [id, token, expiresAt]);

    // Send reset email
    try {
      await sendPasswordResetEmail(user.email, user.username, token);
    } catch (emailError) {
      console.error('Email send error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email.'
      });
    }

    // Log action
    await logAudit({
      userId: id,
      adminId,
      action: AuditActions.ADMIN_PASSWORD_RESET_INITIATED,
      entityType: 'user',
      entityId: id,
      details: { username: user.username, method: 'email' },
      ipAddress
    });

    res.status(200).json({
      success: true,
      message: `Password reset email sent to ${user.email}`
    });

  } catch (error) {
    console.error('Admin password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred initiating password reset.'
    });
  }
};

// Initiate security question challenge (Admin only)
const initiateSecurityChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ipAddress = getClientIp(req);

    // Get user info
    const [user] = await query(
      'SELECT username, email FROM users WHERE id = ? AND is_active = true',
      [id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive.'
      });
    }

    // Check if user has security questions
    const [securityQuestion] = await query(
      'SELECT COUNT(*) as count FROM security_questions WHERE user_id = ?',
      [id]
    );

    if (!securityQuestion || securityQuestion.count === 0) {
      return res.status(400).json({
        success: false,
        message: 'User has not set up security questions.'
      });
    }

    // Get admin info
    const [admin] = await query('SELECT username FROM users WHERE id = ?', [adminId]);

    // Generate challenge token
    const { token, expiresAt } = generateChallengeToken();

    // Create challenge
    const challengeSql = `
      INSERT INTO security_question_challenges (user_id, admin_id, token, expires_at)
      VALUES (?, ?, ?, ?)
    `;
    await query(challengeSql, [id, adminId, token, expiresAt]);

    // Send challenge email
    try {
      await sendSecurityChallengeEmail(user.email, user.username, token, admin.username);
    } catch (emailError) {
      console.error('Email send error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send security challenge email.'
      });
    }

    // Log action
    await logAudit({
      userId: id,
      adminId,
      action: AuditActions.ADMIN_SECURITY_CHALLENGE_SENT,
      entityType: 'user',
      entityId: id,
      details: { username: user.username },
      ipAddress
    });

    res.status(200).json({
      success: true,
      message: `Security challenge sent to ${user.email}`,
      data: {
        challengeId: token,
        expiresAt
      }
    });

  } catch (error) {
    console.error('Initiate security challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred initiating security challenge.'
    });
  }
};

// Get security questions for challenge
const getSecurityQuestions = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Challenge token is required.'
      });
    }

    // Validate token
    const challengeSql = `
      SELECT c.*, u.username, u.email
      FROM security_question_challenges c
      JOIN users u ON c.user_id = u.id
      WHERE c.token = ? AND c.status = 'pending' AND c.expires_at > NOW()
    `;

    const [challenge] = await query(challengeSql, [token]);

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired challenge token.'
      });
    }

    // Get security questions (without answers)
    const questionsSql = `
      SELECT id, question
      FROM security_questions
      WHERE user_id = ?
      ORDER BY id
    `;

    const questions = await query(questionsSql, [challenge.user_id]);

    res.status(200).json({
      success: true,
      data: {
        username: challenge.username,
        questions
      }
    });

  } catch (error) {
    console.error('Get security questions error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred retrieving security questions.'
    });
  }
};

// Verify security answers
const verifySecurityAnswers = async (req, res) => {
  try {
    const { token, answers } = req.body;
    const ipAddress = getClientIp(req);

    // Validate token
    const challengeSql = `
      SELECT c.*, u.username, u.email
      FROM security_question_challenges c
      JOIN users u ON c.user_id = u.id
      WHERE c.token = ? AND c.status = 'pending' AND c.expires_at > NOW()
    `;

    const [challenge] = await query(challengeSql, [token]);

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired challenge token.'
      });
    }

    // Get stored security questions and answers
    const questionsSql = `
      SELECT id, question, answer_hash
      FROM security_questions
      WHERE user_id = ?
    `;

    const storedQuestions = await query(questionsSql, [challenge.user_id]);

    // Verify all answers
    let allCorrect = true;
    for (const answer of answers) {
      const storedQuestion = storedQuestions.find(q => q.id === answer.questionId);

      if (!storedQuestion) {
        allCorrect = false;
        break;
      }

      const isCorrect = await bcrypt.compare(
        answer.answer.toLowerCase().trim(),
        storedQuestion.answer_hash
      );

      if (!isCorrect) {
        allCorrect = false;
        break;
      }
    }

    if (!allCorrect) {
      // Update challenge status
      await query(
        'UPDATE security_question_challenges SET status = ?, completed_at = NOW() WHERE token = ?',
        ['failed', token]
      );

      // Log failed verification
      await logAudit({
        userId: challenge.user_id,
        adminId: challenge.admin_id,
        action: AuditActions.SECURITY_QUESTION_FAILED,
        details: { username: challenge.username },
        ipAddress
      });

      return res.status(401).json({
        success: false,
        message: 'Security answers are incorrect.'
      });
    }

    // Update challenge status to verified
    await query(
      'UPDATE security_question_challenges SET status = ?, completed_at = NOW() WHERE token = ?',
      ['verified', token]
    );

    // Log successful verification
    await logAudit({
      userId: challenge.user_id,
      adminId: challenge.admin_id,
      action: AuditActions.SECURITY_QUESTION_VERIFIED,
      details: { username: challenge.username },
      ipAddress
    });

    res.status(200).json({
      success: true,
      message: 'Identity verified successfully',
      data: {
        challengeToken: token
      }
    });

  } catch (error) {
    console.error('Verify security answers error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred verifying security answers.'
    });
  }
};

// Complete password reset after verification
const completePasswordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const ipAddress = getClientIp(req);

    // Validate challenge token is verified
    const challengeSql = `
      SELECT c.*, u.id as user_id, u.username, u.email
      FROM security_question_challenges c
      JOIN users u ON c.user_id = u.id
      WHERE c.token = ? AND c.status = 'verified'
    `;

    const [challenge] = await query(challengeSql, [token]);

    if (!challenge) {
      return res.status(400).json({
        success: false,
        message: 'Invalid challenge token or verification not completed.'
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS));

    // Update password
    await query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, challenge.user_id]
    );

    // Invalidate all sessions
    await query('DELETE FROM sessions WHERE user_id = ?', [challenge.user_id]);

    // Mark challenge as completed (update to a completed status)
    await query(
      'UPDATE security_question_challenges SET status = ? WHERE token = ?',
      ['expired', token]
    );

    // Log password reset
    await logAudit({
      userId: challenge.user_id,
      adminId: challenge.admin_id,
      action: AuditActions.ADMIN_PASSWORD_RESET_COMPLETED,
      details: { username: challenge.username, method: 'security_questions' },
      ipAddress
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully by administrator'
    });

  } catch (error) {
    console.error('Complete password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred completing password reset.'
    });
  }
};

// Get audit logs (Admin only)
const getAuditLogs = async (req, res) => {
  try {
    const { userId, action, startDate, endDate, page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        a.*,
        u.username as user_username,
        u.sap_id as user_sap_id,
        admin.username as admin_username
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN users admin ON a.admin_id = admin.id
      WHERE 1=1
    `;

    const params = [];

    if (userId) {
      sql += ' AND a.user_id = ?';
      params.push(userId);
    }

    if (action) {
      sql += ' AND a.action = ?';
      params.push(action);
    }

    if (startDate) {
      sql += ' AND a.created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND a.created_at <= ?';
      params.push(endDate);
    }

    if (search) {
      sql += ' AND (u.username LIKE ? OR u.email LIKE ? OR u.sap_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Get total count
    const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await query(countSql, params);
    const total = countResult?.total || 0;

    // Add pagination
    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = await query(sql, params);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred retrieving audit logs.'
    });
  }
};

// Get dashboard statistics (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    // Total users by role
    const userStatsSql = `
      SELECT 
        role,
        COUNT(*) as count,
        SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_count
      FROM users
      GROUP BY role
    `;
    const userStats = await query(userStatsSql);

    // Recent logins (last 24 hours)
    const [recentLogins] = await query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE action = 'LOGIN_SUCCESS' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    // Failed login attempts (last 24 hours)
    const [failedLogins] = await query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE action = 'LOGIN_FAILED' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);

    // Password resets (last 7 days)
    const [passwordResets] = await query(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE action IN ('PASSWORD_RESET_COMPLETED', 'ADMIN_PASSWORD_RESET_COMPLETED')
        AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    // Recent user creations (last 30 days)
    const [newUsers] = await query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);

    // ── Batch stats (Module 6 integration) ──────────────────────────
    const [activeBatches] = await query(`
      SELECT COUNT(*) as count FROM academic_batches WHERE state = 'Active'
    `);
    const [enrolledStudents] = await query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'Student' AND batch_id IS NOT NULL
    `);
    const [pendingProposals] = await query(`
      SELECT COUNT(*) as count FROM proposals WHERE status IN ('submitted', 'pending_member_confirmation')
    `).catch(() => [{ count: 0 }]);
    // ────────────────────────────────────────────────────────────────

    res.status(200).json({
      success: true,
      data: {
        userStats,
        recentActivity: {
          recentLogins: recentLogins?.count || 0,
          failedLogins: failedLogins?.count || 0,
          passwordResets: passwordResets?.count || 0,
          newUsers: newUsers?.count || 0
        },
        batchStats: {
          activeBatches: activeBatches?.count || 0,
          enrolledStudents: enrolledStudents?.count || 0,
          pendingProposals: pendingProposals?.count || 0
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred retrieving dashboard statistics.'
    });
  }
};



// Bulk create users from CSV (Admin only)
const bulkCreateUsers = async (req, res) => {
  try {
    const { role } = req.body;
    const adminId = req.user.id;
    const ipAddress = getClientIp(req);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    // Read and parse CSV file
    const fs = require('fs');
    const csvContent = fs.readFileSync(req.file.path, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty'
      });
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Parse and validate emails (and departments for teachers)
    const usersToCreate = []; // Array of { email, department }
    const errors = [];
    const duplicatesInFile = new Set();

    lines.forEach((line, index) => {
      // For Teacher role, we expect: email,department
      // For others: email

      let email = '';
      let department = null;

      const parts = line.trim().split(',');
      email = parts[0].trim().replace(/^"|"$/g, '');
      if (parts.length > 1) {
        department = parts[1].trim().replace(/^"|"$/g, '');
      }

      // Validate email format
      if (!emailRegex.test(email)) {
        errors.push(`Line ${index + 1}: Invalid email format - "${email}"`);
        return;
      }

      // No absolute requirement for department now due to flexible usage

      const emailLower = email.toLowerCase();

      // Check for duplicates within file
      if (duplicatesInFile.has(emailLower)) {
        errors.push(`Line ${index + 1}: Duplicate email - "${email}"`);
        return;
      }

      duplicatesInFile.add(emailLower);
      usersToCreate.push({ email: emailLower, department });
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV validation failed',
        errors: errors
      });
    }

    // Check for existing users in database
    const emails = usersToCreate.map(u => u.email);
    const existingEmailsQuery = `
      SELECT email FROM users WHERE email IN (${emails.map(() => '?').join(',')})
    `;
    const existingUsers = await query(existingEmailsQuery, emails);
    const existingEmails = existingUsers.map(u => u.email.toLowerCase());

    // Filter out existing emails
    const newUsers = usersToCreate.filter(u => !existingEmails.includes(u.email));

    if (newUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All emails already exist in the system',
        data: {
          total: emails.length,
          existing: existingEmails.length,
          created: 0,
          failed: emails.length
        }
      });
    }

    // Create users
    const results = {
      created: 0,
      failed: 0,
      total: emails.length,
      existingEmails: existingEmails,
      failedEmails: []
    };

    for (const user of newUsers) {
      try {
        // Extract username and SAP ID from email (text before @)
        const baseId = user.email.split('@')[0];

        // Check if username already exists, if so append random number
        let finalUsername = baseId;
        let usernameExists = true;
        let attempts = 0;

        while (usernameExists && attempts < 5) {
          const [existingUser] = await query(
            'SELECT id FROM users WHERE username = ?',
            [finalUsername]
          );

          if (!existingUser) {
            usernameExists = false;
          } else {
            finalUsername = `${baseId}${Math.floor(Math.random() * 9999)}`;
            attempts++;
          }
        }

        if (usernameExists) {
          results.failed++;
          results.failedEmails.push({ email: user.email, reason: 'Username conflict' });
          continue;
        }

        // Generate secure password
        const temporaryPassword = generateSecureToken(12);
        const passwordHash = await bcrypt.hash(temporaryPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);

        // Insert user
        const userSql = `
          INSERT INTO users (username, email, sap_id, password_hash, role, department, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await query(userSql, [
          finalUsername || null,
          user.email || null,
          baseId || null,
          passwordHash,
          role || null,
          user.department || null,
          adminId || null
        ]);
        const newUserId = result.insertId;

        // Log user creation
        await logAudit({
          userId: newUserId,
          adminId,
          action: AuditActions.USER_CREATED,
          entityType: 'user',
          entityId: newUserId,
          details: { username: finalUsername, email: user.email, sap_id: baseId, role, department: user.department, method: 'bulk_create' },
          ipAddress
        });

        // Send account creation email
        try {
          await sendAccountCreationEmail(user.email, finalUsername, baseId, temporaryPassword, role === 'Teacher' ? user.department : null);
          results.created++;
        } catch (emailError) {
          console.error('Email error for', user.email, ':', emailError);
          // Still count as created but note email failure
          results.created++;
          results.failedEmails.push({ email: user.email, reason: 'Email send failed' });
        }

      } catch (error) {
        console.error('Error creating user for', user.email, ':', error);
        results.failed++;
        results.failedEmails.push({ email: user.email, reason: error.message || 'Database error' });
      }
    }

    // Log bulk creation action
    await logAudit({
      userId: adminId,
      adminId,
      action: 'BULK_USER_CREATION',
      entityType: 'user',
      details: {
        total: results.total,
        created: results.created,
        failed: results.failed,
        role
      },
      ipAddress
    });

    res.status(200).json({
      success: true,
      message: `Bulk user creation completed. Created: ${results.created}, Failed: ${results.failed}`,
      data: results
    });

  } catch (error) {
    console.error('Bulk create users error:', error);

    // Clean up uploaded file if it exists
    if (req.file && require('fs').existsSync(req.file.path)) {
      require('fs').unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred during bulk user creation.'
    });
  }
};

// Export workload report (Admin only)
const exportWorkloadReport = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const sql = `
      SELECT 
        u.id, u.username, u.email, u.department, 
        u.max_supervisees, u.current_supervisees, 
        u.availability_status, u.is_accepting_proposals,
        (u.max_supervisees - u.current_supervisees) as remaining_capacity,
        CASE 
          WHEN u.current_supervisees >= u.max_supervisees THEN 'Overloaded'
          WHEN u.current_supervisees >= (u.max_supervisees * 0.8) THEN 'Near Capacity'
          ELSE 'Available'
        END as workload_status
      FROM users u
      WHERE u.role = 'Teacher' AND u.is_active = 1
      ORDER BY u.department, u.username
    `;

    const supervisors = await query(sql);

    if (format === 'csv') {
      const fields = [
        'username', 'email', 'department',
        'max_supervisees', 'current_supervisees',
        'remaining_capacity', 'workload_status', 'availability_status'
      ];

      let csv = fields.join(',') + '\n';

      supervisors.forEach(s => {
        csv += fields.map(field => {
          const val = s[field] || '';
          return `"${val}"`;
        }).join(',') + '\n';
      });

      res.header('Content-Type', 'text/csv');
      res.attachment('supervisor_workload_report.csv');
      return res.send(csv);
    }

    res.status(200).json({
      success: true,
      data: supervisors
    });

  } catch (error) {
    console.error('Export workload report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate workload report'
    });
  }
};

// Get capacity alerts (Admin only)
const getCapacityAlerts = async (req, res) => {
  try {
    const { threshold = 0.8 } = req.query; // Default threshold 80%

    const sql = `
      SELECT 
        id, username, email, department,
        max_supervisees, current_supervisees,
        (max_supervisees - current_supervisees) as remaining_capacity,
        CASE 
          WHEN current_supervisees >= max_supervisees THEN 'Exceeded'
          WHEN current_supervisees >= (max_supervisees * ?) THEN 'Threshold Reached'
          ELSE 'Normal'
        END as alert_type
      FROM users
      WHERE role = 'Teacher' 
      AND is_active = 1
      AND current_supervisees >= (max_supervisees * ?)
      ORDER BY current_supervisees DESC
    `;

    const alerts = await query(sql, [threshold, threshold]);

    res.status(200).json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Get capacity alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve capacity alerts'
    });
  }
};

// Reset supervisor workload (Admin only)
const resetWorkload = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ipAddress = getClientIp(req);

    await query('UPDATE users SET current_supervisees = 0 WHERE id = ?', [id]);

    // Log action
    await logAudit({
      userId: id,
      adminId,
      action: 'WORKLOAD_RESET',
      entityType: 'user',
      entityId: id,
      details: { message: 'Workload reset to 0' },
      ipAddress
    });

    res.json({ success: true, message: 'Workload reset successfully' });
  } catch (error) {
    console.error('Reset workload error:', error);
    res.status(500).json({ success: false, message: 'Error resetting workload' });
  }
};

// Decrement supervisor workload (Admin only)
const decrementWorkload = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const ipAddress = getClientIp(req);

    await query('UPDATE users SET current_supervisees = GREATEST(0, current_supervisees - 1) WHERE id = ?', [id]);

    // Log action
    await logAudit({
      userId: id,
      adminId,
      action: 'WORKLOAD_DECREMENT',
      entityType: 'user',
      entityId: id,
      details: { message: 'Workload decremented by 1' },
      ipAddress
    });

    res.json({ success: true, message: 'Workload decremented successfully' });
  } catch (error) {
    console.error('Decrement workload error:', error);
    res.status(500).json({ success: false, message: 'Error decrementing workload' });
  }
};

// Export all users (Admin only)
const exportUsers = async (req, res) => {
  try {
    const { role, department, search, fields: requestedFields, userIds } = req.body;

    const validFields = ['username', 'email', 'sap_id', 'role', 'department', 'status', 'date_joined'];

    // Determine which columns to export
    let fields = validFields;
    if (Array.isArray(requestedFields) && requestedFields.length > 0) {
      fields = requestedFields.filter(f => validFields.includes(f));
      if (fields.length === 0) fields = validFields;
    }

    // Build query
    let sql = `
      SELECT 
        username, email, sap_id, role, department, 
        CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END as status,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as date_joined
      FROM users
      WHERE 1=1
    `;
    const params = [];

    // Filter by selected user IDs (if admin selected specific rows)
    if (Array.isArray(userIds) && userIds.length > 0) {
      sql += ` AND id IN (${userIds.map(() => '?').join(',')})`;
      params.push(...userIds);
    } else {
      // Otherwise apply table filters
      if (role && role !== 'all') {
        sql += ' AND role = ?';
        params.push(role);
      }
      if (department && department !== 'all') {
        sql += ' AND department = ?';
        params.push(department);
      }
      if (search && search.trim()) {
        sql += ' AND (username LIKE ? OR email LIKE ? OR sap_id LIKE ?)';
        const s = `%${search.trim()}%`;
        params.push(s, s, s);
      }
    }

    sql += ' ORDER BY role, username';

    const users = await query(sql, params);

    if (users.length === 0) {
      // Return an empty CSV with headers so it's not blank
      const csv = fields.join(',') + '\n';
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
      return res.end(csv);
    }

    // Generate CSV
    let csv = fields.map(f => `"${f.replace('_', ' ')}"`).join(',') + '\n';
    users.forEach(u => {
      csv += fields.map(field => `"${u[field] !== null && u[field] !== undefined ? String(u[field]).replace(/"/g, '""') : ''}"`).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
    return res.end(csv);

  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred exporting users.'
    });
  }
};

// Announce Results (Module 10)
const announceResults = async (req, res) => {
  try {
    const { batchId } = req.params;
    
    if (!batchId) {
      return res.status(400).json({ success: false, message: 'Batch ID is required' });
    }

    // Consolidation Formula: Final% = (Group_Committee_Average / 2) + (Individual_Supervisor_Marks / 2).
    const [students] = await query(`
      SELECT 
        u.sap_id, p.id as proposal_id, COALESCE(sm.total_marks, 0) as supervisor_total, p.batch_id
      FROM proposals p
      JOIN proposal_members pm ON p.id = pm.proposal_id
      JOIN users u ON pm.sap_id COLLATE utf8mb4_unicode_ci = u.sap_id COLLATE utf8mb4_unicode_ci
      LEFT JOIN supervisor_marks sm ON sm.proposal_id = p.id AND sm.student_sap_id COLLATE utf8mb4_unicode_ci = u.sap_id COLLATE utf8mb4_unicode_ci
      WHERE p.batch_id = ? AND p.status = 'approved'
    `, [batchId]);

    // Clear previous results for this batch
    await query(`DELETE FROM final_results WHERE batch_id = ?`, [batchId]);

    for (const student of students) {
        const [commAvgRow] = await query(`
            SELECT AVG(total_marks) as avg_marks 
            FROM committee_evaluations 
            WHERE proposal_id = ? AND status = 'SUBMITTED'
        `, [student.proposal_id]);

        const commAvg = parseFloat(commAvgRow[0]?.avg_marks || 0);
        const supTotal = parseFloat(student.supervisor_total || 0);

        const committee_score_50 = commAvg / 2;
        const supervisor_score_50 = supTotal / 2;
        const final_percentage = committee_score_50 + supervisor_score_50;

        let letter_grade = 'F';
        if (final_percentage >= 85) letter_grade = 'A';
        else if (final_percentage >= 80) letter_grade = 'A-';
        else if (final_percentage >= 75) letter_grade = 'B+';
        else if (final_percentage >= 71) letter_grade = 'B';
        else if (final_percentage >= 68) letter_grade = 'B-';
        else if (final_percentage >= 64) letter_grade = 'C+';
        else if (final_percentage >= 61) letter_grade = 'C';
        else if (final_percentage >= 57) letter_grade = 'C-';
        else if (final_percentage >= 54) letter_grade = 'D+';
        else if (final_percentage >= 50) letter_grade = 'D';

        await query(`
            INSERT INTO final_results (student_sap_id, batch_id, supervisor_score_50, committee_score_50, final_percentage, letter_grade)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [student.sap_id, parseInt(batchId), supervisor_score_50, committee_score_50, final_percentage, letter_grade]);
    }

    // Set results_released = true
    await query(`UPDATE academic_batches SET results_released = TRUE WHERE id = ?`, [batchId]);

    res.status(200).json({ success: true, message: 'Results announced successfully' });
  } catch (err) {
    console.error('Announce Results Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Finalize Batch (FYP-I -> FYP-II transition)
const finalizeBatch = async (req, res) => {
    const { batch_id } = req.body;
    const adminId = req.user.id;
    const ipAddress = getClientIp(req);

    if (!batch_id) {
        return res.status(400).json({ success: false, message: 'Batch ID is required' });
    }

    try {
        await transaction(async (connection) => {
            // 1. Get all passing students (final_percentage >= 50)
            const [passingStudents] = await connection.query(`
                SELECT student_sap_id, final_percentage 
                FROM final_grades 
                WHERE batch_id = ? AND final_percentage >= 50
            `, [batch_id]);

            if (passingStudents.length === 0) {
                return res.status(404).json({ success: false, message: 'No passing students found for this batch.' });
            }

            const sapIds = passingStudents.map(s => s.student_sap_id);

            // 2. Find groups for these students in FYP-I
            const [groups] = await connection.query(`
                SELECT DISTINCT p.* 
                FROM proposals p
                JOIN proposal_members pm ON p.id = pm.proposal_id
                WHERE pm.sap_id IN (?) AND p.batch_id = ? AND p.fyp_part = 'FYP-I' AND p.status = 'approved'
            `, [sapIds, batch_id]);

            let transitionedCount = 0;
            let failedCount = 0; // Not passing students, but groups where nobody passed? Actually simpler to count students.
            
            // Total students in batch
            const [totalStudents] = await connection.query(`
                SELECT COUNT(DISTINCT pm.sap_id) as count
                FROM proposal_members pm
                JOIN proposals p ON pm.proposal_id = p.id
                WHERE p.batch_id = ? AND p.status = 'approved'
            `, [batch_id]);
            
            failedCount = totalStudents[0].count - passingStudents.length;

            for (const group of groups) {
                // Check if all members of this group passed
                const [groupMembers] = await connection.query(`
                    SELECT sap_id FROM proposal_members WHERE proposal_id = ?
                `, [group.id]);
                
                const groupSapIds = groupMembers.map(m => m.sap_id);
                const allPassed = groupSapIds.every(id => sapIds.includes(id));
                
                if (allPassed) {
                    // Create new FYP-II group record
                    const [result] = await connection.query(`
                        INSERT INTO proposals (
                            student_id, supervisor_id, supervisor_sap_id, project_title, 
                            project_description, status, fyp_part, batch_id, parent_group_id
                        ) VALUES (?, ?, ?, ?, ?, 'approved', 'FYP-II', ?, ?)
                    `, [
                        group.student_id, group.supervisor_id, group.supervisor_sap_id, 
                        group.project_title, group.project_description, group.batch_id, group.id
                    ]);
                    
                    const newGroupId = result.insertId;

                    // Copy members
                    const [members] = await connection.query(`
                        SELECT * FROM proposal_members WHERE proposal_id = ?
                    `, [group.id]);

                    for (const member of members) {
                        await connection.query(`
                            INSERT INTO proposal_members (
                                proposal_id, sap_id, email, phone_number, department, display_order, status
                            ) VALUES (?, ?, ?, ?, ?, ?, 'accepted')
                        `, [
                            newGroupId, member.sap_id, member.email, member.phone_number, 
                            member.department, member.display_order
                        ]);
                    }

                    // Copy milestone history (task_submissions)
                    const [submissions] = await connection.query(`
                        SELECT * FROM task_submissions WHERE proposal_id = ?
                    `, [group.id]);

                    for (const sub of submissions) {
                        await connection.query(`
                            INSERT INTO task_submissions (
                                task_id, proposal_id, student_id, file_path, submission_status, 
                                supervisor_feedback, grade, feedback_date
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        `, [
                            sub.task_id, newGroupId, sub.student_id, sub.file_path, 
                            sub.submission_status, sub.supervisor_feedback, sub.grade, sub.feedback_date
                        ]);
                    }

                    transitionedCount++;
                }
            }

            // 3. Log Audit
            await logAudit({
                adminId,
                action: AuditActions.BATCH_FINALIZED,
                entityType: 'batch',
                entityId: batch_id,
                details: { passed: passingStudents.length, transitioned_groups: transitionedCount },
                ipAddress
            });

            return res.status(200).json({
                success: true,
                message: 'Batch finalized successfully',
                data: {
                    passed: passingStudents.length,
                    failed: failedCount,
                    transitioned_groups: transitionedCount
                }
            });
        });
    } catch (error) {
        console.error('Finalize batch error:', error);
        return res.status(500).json({ success: false, message: 'An error occurred finalizing the batch.' });
    }
};

module.exports = {
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
};
