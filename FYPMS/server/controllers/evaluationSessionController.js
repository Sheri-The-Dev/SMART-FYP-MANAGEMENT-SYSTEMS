const { pool } = require('../config/database');
const { sendEvaluationSessionEmail } = require('../utils/emailService');

// Helper to get day name from date
const getDayName = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// ============================================
// FUNCTION 1: GET ALL EVALUATION SESSIONS
// ============================================
exports.getAllEvaluationSessions = async (req, res) => {
  try {
    const { batch_id } = req.query;
    if (!batch_id) {
      return res.status(400).json({ success: false, message: 'Batch ID is required' });
    }

    const sql = `
      SELECT 
        es.*, 
        COUNT(DISTINCT esa.id) as group_count, 
        GROUP_CONCAT(DISTINCT u.username) as committee_names 
      FROM evaluation_sessions es 
      LEFT JOIN evaluation_session_assignments esa ON esa.session_id = es.id 
      LEFT JOIN evaluation_session_committee esc ON esc.session_id = es.id 
      LEFT JOIN users u ON u.id = esc.committee_member_id 
      WHERE es.batch_id = ? 
      GROUP BY es.id
      ORDER BY es.session_date DESC, es.session_time DESC
    `;
    
    const [sessions] = await pool.query(sql, [batch_id]);
    
    // Get group details for each session
    for (let session of sessions) {
      const groupSql = `
        SELECT pr.id, pr.project_title, u.username as lead_name
        FROM evaluation_session_assignments esa
        JOIN proposals pr ON pr.id = esa.group_id
        JOIN users u ON u.id = pr.student_id
        WHERE esa.session_id = ?
      `;
      const [groups] = await pool.query(groupSql, [session.id]);
      session.groups = groups;

      const committeeSql = `
        SELECT u.id, u.username, u.email
        FROM evaluation_session_committee esc
        JOIN users u ON u.id = esc.committee_member_id
        WHERE esc.session_id = ?
      `;
      const [committee] = await pool.query(committeeSql, [session.id]);
      session.committee = committee;
    }

    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    console.error('getAllEvaluationSessions Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving sessions.' });
  }
};

// ============================================
// FUNCTION 2: CREATE EVALUATION SESSION
// ============================================
exports.createEvaluationSession = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      batch_id, session_type, session_date, session_time, 
      venue, academic_year, group_ids = [], committee_member_ids = [] 
    } = req.body;

    if (!batch_id || !session_type || !session_date || !session_time || !venue) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Step 1: Insert into evaluation_sessions
    const [result] = await connection.execute(
      `INSERT INTO evaluation_sessions 
       (batch_id, session_type, session_date, session_time, venue, academic_year, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [batch_id, session_type, session_date, session_time, venue, academic_year, req.user.id]
    );
    const sessionId = result.insertId;

    // Step 2: Insert into evaluation_session_assignments
    if (Array.isArray(group_ids) && group_ids.length > 0) {
      for (const groupId of group_ids) {
        await connection.execute(
          'INSERT INTO evaluation_session_assignments (session_id, group_id) VALUES (?, ?)',
          [sessionId, groupId]
        );
      }
    }

    // Step 3: Insert into evaluation_session_committee
    if (Array.isArray(committee_member_ids) && committee_member_ids.length > 0) {
      for (const committeeId of committee_member_ids) {
        await connection.execute(
          'INSERT INTO evaluation_session_committee (session_id, committee_member_id) VALUES (?, ?)',
          [sessionId, committeeId]
        );

        // Update temporary role for committee member (Step 4 fix)
        try {
          await connection.execute(
            `UPDATE users SET 
             temporary_role = 'Committee', 
             temporary_role_session_id = ?, 
             temporary_role_expires_at = DATE_ADD(?, INTERVAL 7 DAY) 
             WHERE id = ? AND role != 'Committee'`,
            [sessionId, session_date, committeeId]
          );
        } catch (roleErr) {
          console.warn('[WARN] Temporary role update skipped:', roleErr.sqlMessage);
          // Continue — don't throw, session creation should still succeed
        }
      }
    }

    await connection.commit();
    
    // Send response immediately
    res.status(201).json({
      success: true,
      message: 'Evaluation session scheduled successfully. Committee members will be notified via email.',
      data: { id: sessionId, group_count: group_ids.length }
    });

    // Step 4: Send email notifications (Non-blocking)
    const processEmails = async () => {
      try {
        const dayName = getDayName(session_date);
        
        // Fetch group details for email
        let groups = [];
        if (group_ids && group_ids.length > 0) {
          const placeholders = group_ids.map(() => '?').join(',');
          const [fetchedGroups] = await pool.query(
            `SELECT pr.project_title, u.username as lead_name, u.email as lead_email, pr.id as proposal_id
             FROM proposals pr
             JOIN users u ON u.id = pr.student_id
             WHERE pr.id IN (${placeholders})`,
            group_ids
          );
          groups = fetchedGroups;
        }

        const groupTitles = groups.map(g => g.project_title).join(', ');

        // Email to committee members
        let committeeMembers = [];
        if (committee_member_ids && committee_member_ids.length > 0) {
          const placeholders = committee_member_ids.map(() => '?').join(',');
          const [fetchedCommitteeMembers] = await pool.query(
            `SELECT username, email FROM users WHERE id IN (${placeholders})`,
            committee_member_ids
          );
          committeeMembers = fetchedCommitteeMembers;
        }

        for (const member of committeeMembers) {
          await sendEvaluationSessionEmail(
            member.email,
            `FYP Evaluation Session — Duty Assignment | ${session_date}`,
            `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; 
    margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    
    <!-- Header -->
    <div style="background: #1e3a5f; padding: 24px 32px;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">
        FYP Evaluation Duty Assignment
      </h1>
      <p style="color: #a8c4e0; margin: 6px 0 0; font-size: 13px;">
        Riphah International University — BSSE Program
      </p>
    </div>

    <!-- Body -->
    <div style="padding: 28px 32px; background: #ffffff;">
      <p style="color: #333; font-size: 15px; margin-top: 0;">
        Dear <strong>${member.username}</strong>,
      </p>
      <p style="color: #555; font-size: 14px; line-height: 1.6;">
        You have been assigned as an <strong>Evaluation Committee Member</strong> 
        for the upcoming FYP evaluation session. Please review the details below 
        and make yourself available accordingly.
      </p>

      <!-- Session Details Box -->
      <div style="background: #f0f4f8; border-left: 4px solid #1e3a5f; 
        padding: 16px 20px; border-radius: 4px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="color: #666; padding: 6px 0; width: 140px;">
              <strong>Session Type</strong>
            </td>
            <td style="color: #1e3a5f; font-weight: 600;">
              ${session_type === 'PROGRESS_PRESENTATION' ? 
                'Progress Presentation (FYP-I)' : 'Final Demo (FYP-II)'}
            </td>
          </tr>
          <tr>
            <td style="color: #666; padding: 6px 0;"><strong>Date</strong></td>
            <td style="color: #333;">${session_date} &nbsp;(${dayName})</td>
          </tr>
          <tr>
            <td style="color: #666; padding: 6px 0;"><strong>Time</strong></td>
            <td style="color: #333;">${session_time}</td>
          </tr>
          <tr>
            <td style="color: #666; padding: 6px 0;"><strong>Venue</strong></td>
            <td style="color: #333;">${venue}</td>
          </tr>
          <tr>
            <td style="color: #666; padding: 6px 0; vertical-align: top;">
              <strong>Assigned Groups</strong>
            </td>
            <td style="color: #333;">${groupTitles}</td>
          </tr>
        </table>
      </div>

      <!-- Instructions -->
      <div style="background: #fff8e1; border: 1px solid #ffe082; 
        padding: 14px 18px; border-radius: 4px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 13px; color: #5d4037;">
          <strong>📋 Evaluation Instructions:</strong><br/>
          Please evaluate each assigned group independently using the official 
          LO rubric (LO1–LO8) available on the FYP portal. Marks must be 
          submitted before the session closes. Scoring is blind — do not 
          share your marks with other committee members.
        </p>
      </div>

      <p style="color: #555; font-size: 14px;">
        Log in to the <strong>FYP Management System</strong> on the day of 
        evaluation to enter your assessment marks.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f5f5f5; padding: 16px 32px; 
      border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated message from the FYP Management System.<br/>
        Riphah International University — Department of Software Engineering
      </p>
    </div>
  </div>
`
          );
        }
      } catch (err) {
        console.error('Background Email Error:', err);
      }
    };

    // Fire emails after response — completely non-blocking
    setImmediate(() => processEmails());
  } catch (error) {
    await connection.rollback();
    console.error('[CRITICAL] Create session error:', JSON.stringify({
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    }, null, 2));
    res.status(500).json({ success: false, message: 'Server error scheduling session.', error: error.message });
  } finally {
    connection.release();
  }
};

// ============================================
// FUNCTION 3: UPDATE EVALUATION SESSION
// ============================================
exports.updateEvaluationSession = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { 
      session_date, session_time, venue, 
      group_ids = [], committee_member_ids = [] 
    } = req.body;

    // Step 1: Update evaluation_sessions
    await connection.query(
      'UPDATE evaluation_sessions SET session_date = ?, session_time = ?, venue = ? WHERE id = ?',
      [session_date, session_time, venue, id]
    );

    // Step 2: Delete old assignments, INSERT new group_ids
    await connection.query('DELETE FROM evaluation_session_assignments WHERE session_id = ?', [id]);
    if (Array.isArray(group_ids) && group_ids.length > 0) {
      for (const groupId of group_ids) {
        await connection.query(
          'INSERT INTO evaluation_session_assignments (session_id, group_id) VALUES (?, ?)',
          [id, groupId]
        );
      }
    }

    // Step 3: Delete old committee, INSERT new committee_member_ids
    await connection.query('DELETE FROM evaluation_session_committee WHERE session_id = ?', [id]);
    
    // Revoke old temporary roles for this session
    await connection.query(
      'UPDATE users SET temporary_role = NULL, temporary_role_session_id = NULL, temporary_role_expires_at = NULL WHERE temporary_role_session_id = ?',
      [id]
    );

    if (Array.isArray(committee_member_ids) && committee_member_ids.length > 0) {
      for (const committeeId of committee_member_ids) {
        await connection.query(
          'INSERT INTO evaluation_session_committee (session_id, committee_member_id) VALUES (?, ?)',
          [id, committeeId]
        );

        // Grant new temporary roles
        await connection.query(
          `UPDATE users SET 
           temporary_role = 'Committee', 
           temporary_role_session_id = ?, 
           temporary_role_expires_at = DATE_ADD(?, INTERVAL 7 DAY) 
           WHERE id = ?`,
          [id, session_date, committeeId]
        );
      }
    }

    // Step 4: Send reschedule email (Simplified for this task)
    // In a real app, you'd compare old and new and only notify affected people.
    // For this task, we'll notify the current assigned people about the update.
    
    // (Email logic similar to createEvaluationSession would go here)

    await connection.commit();
    res.status(200).json({
      success: true,
      message: 'Evaluation session successfully updated.',
      data: { group_count: group_ids.length }
    });
  } catch (error) {
    await connection.rollback();
    console.error('updateEvaluationSession Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating session.' });
  } finally {
    connection.release();
  }
};

// ============================================
// FUNCTION 4: GET MY EVALUATION SCHEDULE (Student)
// ============================================
exports.getMyEvaluationSchedule = async (req, res) => {
  const studentId = req.user.id;
  try {
    const [rows] = await pool.query(`
      SELECT 
        es.session_date, es.session_time, es.venue, es.session_type,
        pr.project_title, pr.id as group_id
      FROM proposals pr
      JOIN evaluation_session_assignments esa ON esa.group_id = pr.id
      JOIN evaluation_sessions es ON es.id = esa.session_id
      WHERE pr.student_id = ? OR pr.id IN (
        SELECT proposal_id FROM proposal_members WHERE email = ? AND status = 'accepted'
      )
      ORDER BY es.session_date ASC
      LIMIT 1
    `, [studentId, req.user.email]);

    if (rows.length === 0) {
      return res.status(200).json({ success: true, scheduled: false, message: 'No evaluation scheduled yet.' });
    }

    res.status(200).json({ success: true, scheduled: true, data: rows[0] });
  } catch (error) {
    console.error('getMyEvaluationSchedule Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================================
// FUNCTION 5: GET COMMITTEE ASSIGNED GROUPS (Committee)
// ============================================
exports.getCommitteeAssignedGroups = async (req, res) => {
  const committeeId = req.user.id;
  try {
    const sql = `
      SELECT 
        es.id as session_id, es.session_type, es.session_date, es.session_time, es.venue,
        pr.id as group_id, pr.project_title,
        u.username as lead_name, u.email as lead_email
      FROM evaluation_sessions es
      JOIN evaluation_session_committee esc ON esc.session_id = es.id
      JOIN evaluation_session_assignments esa ON esa.session_id = es.id
      JOIN proposals pr ON pr.id = esa.group_id
      JOIN users u ON u.id = pr.student_id
      WHERE esc.committee_member_id = ? AND es.is_active = true
      ORDER BY es.session_date ASC, es.session_time ASC
    `;
    
    const [rows] = await pool.query(sql, [committeeId]);

    // Get members for each group
    for (let row of rows) {
      const [members] = await pool.query(
        `SELECT u.username, u.email, u.sap_id 
         FROM users u 
         JOIN proposal_members pm ON pm.email = u.email 
         WHERE pm.proposal_id = ? AND pm.status = 'accepted'`,
        [row.group_id]
      );
      row.members = members;
    }

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('getCommitteeAssignedGroups Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ============================================
// FUNCTION 6: DELETE EVALUATION SESSION
// ============================================
exports.deleteEvaluationSession = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Revoke temporary roles before deleting the session
    await connection.query(
      'UPDATE users SET temporary_role = NULL, temporary_role_session_id = NULL, temporary_role_expires_at = NULL WHERE temporary_role_session_id = ?',
      [id]
    );

    // Assignments and committee entries will be deleted via ON DELETE CASCADE in DB schema
    await connection.query('DELETE FROM evaluation_sessions WHERE id = ?', [id]);

    await connection.commit();
    res.status(200).json({ success: true, message: 'Session and temporary roles deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('deleteEvaluationSession Error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting session' });
  } finally {
    connection.release();
  }
};
