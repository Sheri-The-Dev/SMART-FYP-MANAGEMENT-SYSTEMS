const fs = require('fs');
const { query, transaction } = require('../config/database');

// Create Academic Batch
const createBatch = async (req, res) => {
  try {
    const { name, department, academic_year, fyp_phase, start_date } = req.body;
    const adminId = req.user?.id || 1; // Assuming adminId from auth middleware

    const sql = `
      INSERT INTO academic_batches (name, department, academic_year, fyp_phase, state, start_date, created_by)
      VALUES (?, ?, ?, ?, 'Draft', ?, ?)
    `;
    const result = await query(sql, [name, department, academic_year, fyp_phase, start_date, adminId]);

    res.status(201).json({
      success: true,
      data: { id: result.insertId, name, state: 'Draft' },
      message: 'Batch created successfully in Draft state.'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Batch name must be unique.' });
    }
    console.error('createBatch error:', error);
    res.status(500).json({ success: false, message: 'Server error creating batch.' });
  }
};

// Get All Batches
const getBatches = async (req, res) => {
  try {
    const sql = `
      SELECT b.*, 
        (SELECT COUNT(*) FROM users WHERE batch_id = b.id) as enrolled_students,
        t.name as track_name
      FROM academic_batches b
      LEFT JOIN milestone_tracks t ON b.track_id = t.id
      ORDER BY b.created_at DESC
    `;
    const batches = await query(sql);
    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    console.error('getBatches error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching batches.' });
  }
};

// Update Batch State
const updateBatchState = async (req, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body;

    const [batch] = await query('SELECT * FROM academic_batches WHERE id = ?', [id]);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    // Enforce logic: Only one batch per dept per phase can be Active
    if (state === 'Active') {
      const activeBatchesSql = `
        SELECT id FROM academic_batches 
        WHERE department = ? AND fyp_phase = ? AND state = 'Active' AND id != ?
      `;
      const activeBatches = await query(activeBatchesSql, [batch.department, batch.fyp_phase, id]);
      if (activeBatches.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'An active batch already exists for this department and phase. Please archive/freeze it first.'
        });
      }

      // Pre-activation checklist enforcement
      if (!batch.track_id) {
        return res.status(400).json({ success: false, message: 'Cannot activate: Milestone Track is not assigned.' });
      }

      const [enrollment] = await query('SELECT COUNT(*) as count FROM users WHERE batch_id = ?', [id]);
      if (enrollment?.count === 0) {
        return res.status(400).json({ success: false, message: 'Cannot activate: No students are enrolled.' });
      }

      // Automatically assign phase to all enrolled students
      await query('UPDATE users SET fyp_phase = ? WHERE batch_id = ?', [batch.fyp_phase, id]);
    }

    await query('UPDATE academic_batches SET state = ? WHERE id = ?', [state, id]);

    // Log state change
    // Using simple console log or existing logAudit structure if required, assuming it's done elsewhere or via triggers

    res.status(200).json({ success: true, message: `Batch state updated to ${state}` });
  } catch (error) {
    console.error('updateBatchState error:', error);
    res.status(500).json({ success: false, message: 'Server error updating batch state.' });
  }
};

// Enroll Students via CSV (expects req.file with an 'email' column)
const enrollStudents = async (req, res) => {
  try {
    const { batchId } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required' });
    if (!batchId) return res.status(400).json({ success: false, message: 'Batch ID required' });

    const [batch] = await query('SELECT * FROM academic_batches WHERE id = ?', [batchId]);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const csvContent = fs.readFileSync(req.file.path, 'utf-8');
    // Fix: split on real newlines (handles both \n and \r\n from Windows Excel exports)
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');

    let enrolledCount = 0;
    let skippedCount = 0;
    let errors = [];
    let emailColIndex = 0;

    await transaction(async (connection) => {
      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));

        // Detect header row and find the 'email' column index
        if (i === 0) {
          const lower = cols.map(c => c.toLowerCase());
          const idx = lower.indexOf('email');
          if (idx !== -1) {
            emailColIndex = idx;
            continue; // skip header
          }
          // No header found — assume first column is email
        }

        const email = cols[emailColIndex];
        if (!email || !email.includes('@')) {
          errors.push(`Row ${i + 1}: Invalid or missing email "${email}".`);
          continue;
        }

        const [user] = await connection.query('SELECT id, role, batch_id, department FROM users WHERE email = ?', [email]);

        if (!user || user.length === 0) {
          errors.push(`Row ${i + 1}: Email "${email}" not found in system.`);
          continue;
        }

        const u = Array.isArray(user) ? user[0] : user;

        if (batch.department !== 'All Departments' && (u.department || '').toLowerCase() !== batch.department.toLowerCase()) {
          errors.push(`Row ${i + 1}: Department Mismatch Error! Student belongs to ${u.department || 'Unassigned'}, but this Batch is strictly for ${batch.department}.`);
          continue;
        }

        if (u.role !== 'Student') {
          errors.push(`Row ${i + 1}: "${email}" is not a Student account.`);
          continue;
        }

        if (u.batch_id && u.batch_id != batchId) {
          errors.push(`Row ${i + 1}: "${email}" is already enrolled in another batch.`);
          skippedCount++;
          continue;
        }

        await connection.query('UPDATE users SET batch_id = ?, fyp_phase = ? WHERE id = ?', [batchId, batch.fyp_phase, u.id]);
        enrolledCount++;
      }
    });

    fs.unlinkSync(req.file.path);

    const parts = [`Enrolled ${enrolledCount} student(s).`];
    if (skippedCount > 0) parts.push(`${skippedCount} skipped (already in another batch).`);
    if (errors.length > 0) parts.push(`${errors.length} error(s).`);

    res.status(200).json({
      success: true,
      message: parts.join(' '),
      errors
    });
  } catch (error) {
    console.error('enrollStudents error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Server error enrolling students.' });
  }
};

// Update Batch (Draft only)
const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, department, academic_year, fyp_phase, start_date } = req.body;

    const [batch] = await query('SELECT * FROM academic_batches WHERE id = ?', [id]);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    if (batch.state !== 'Draft') {
      return res.status(403).json({ success: false, message: 'Only Draft batches can be edited.' });
    }

    await query(
      `UPDATE academic_batches SET name = ?, department = ?, academic_year = ?, fyp_phase = ?, start_date = ? WHERE id = ?`,
      [name || batch.name, department || batch.department, academic_year || batch.academic_year, fyp_phase || batch.fyp_phase, start_date || batch.start_date, id]
    );

    res.status(200).json({ success: true, message: 'Batch updated successfully.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Batch name must be unique.' });
    }
    console.error('updateBatch error:', error);
    res.status(500).json({ success: false, message: 'Server error updating batch.' });
  }
};

// Delete Batch
const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const [batch] = await query('SELECT * FROM academic_batches WHERE id = ?', [id]);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found.' });

    if (batch.state === 'Frozen') {
      return res.status(403).json({ success: false, message: 'Cannot delete a Frozen batch.' });
    }

    await transaction(async (connection) => {
      // Un-enroll any students from this batch
      await connection.query('UPDATE users SET batch_id = NULL WHERE batch_id = ?', [id]);

      // Cascade delete or soft delete associated records
      await connection.query('DELETE FROM task_submissions WHERE proposal_id IN (SELECT id FROM proposals WHERE batch_id = ?)', [id]);
      await connection.query('DELETE FROM proposals WHERE batch_id = ?', [id]);

      // Finally delete the batch
      await connection.query('DELETE FROM academic_batches WHERE id = ?', [id]);
    });

    res.status(200).json({ success: true, message: 'Batch and related data deleted successfully.' });
  } catch (error) {
    console.error('deleteBatch error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting batch.' });
  }
};

// FYP-I to FYP-II Transition
const transitionBatch = async (req, res) => {
  try {
    const { sourceBatchId } = req.body;
    const adminId = req.user?.id || 1;

    await transaction(async (connection) => {
      let step = 'Verify source batch';
      try {
        const [sourceBatchRows] = await connection.query('SELECT * FROM academic_batches WHERE id = ?', [sourceBatchId]);
        if (!sourceBatchRows || sourceBatchRows.length === 0) {
          throw new Error('Source batch not found');
        }
        const sBatch = sourceBatchRows[0];

        if (sBatch.fyp_phase !== 'FYP-I') {
          throw new Error('Source batch must be FYP-I');
        }

        const { override, override_reason } = req.body;

        step = 'Check Issue Flags';
        if (!override) {
          const [flagRows] = await connection.query(
            'SELECT COUNT(*) as count FROM transition_issue_flags WHERE batch_id = ? AND is_resolved = FALSE',
            [sourceBatchId]
          );
          if (flagRows && flagRows[0] && flagRows[0].count > 0) {
            throw new Error('Cannot transition: There are unresolved Transition Issue Flags for groups in this batch.');
          }
        }

        step = 'Create Target Batch (FYP-II)';
        const targetName = sBatch.name + '-FYPII';
        const [createResult] = await connection.query(
          `INSERT INTO academic_batches (name, department, academic_year, fyp_phase, state, start_date, created_by) 
           VALUES (?, ?, ?, 'FYP-II', 'Draft', NOW(), ?)`,
          [targetName, sBatch.department, sBatch.academic_year, adminId]
        );
        const targetBatchId = createResult.insertId;

        step = 'Migrate Users';
        await connection.query(
          'UPDATE users SET batch_id = ?, fyp_phase = "FYP-II" WHERE batch_id = ?',
          [targetBatchId, sourceBatchId]
        );

        step = 'Reset supervisor workload';
        const [supervisorRows] = await connection.query(
          `SELECT DISTINCT supervisor_id FROM proposals 
           WHERE batch_id = ? AND status = 'approved' AND supervisor_id IS NOT NULL`,
          [sourceBatchId]
        );
        if (supervisorRows && supervisorRows.length > 0) {
          const supervisorIds = supervisorRows.map(s => s.supervisor_id);
          const placeholders = supervisorIds.map(() => '?').join(',');
          await connection.query(
            `UPDATE users SET current_supervisees = 0 WHERE id IN (${placeholders})`,
            supervisorIds
          );
        }

        step = 'Migrate Approved Proposals';
        await connection.query(
          'UPDATE proposals SET batch_id = ? WHERE batch_id = ? AND status = "approved"',
          [targetBatchId, sourceBatchId]
        );

        step = 'Mark source batch as Archived';
        await connection.query(
          'UPDATE academic_batches SET state = "Archived" WHERE id = ?',
          [sourceBatchId]
        );

        step = 'Insert into transition_audits';
        await connection.query(
          `INSERT INTO transition_audits (source_batch_id, target_batch_id, transitioned_by, override_reason) 
           VALUES (?, ?, ?, ?)`,
          [sourceBatchId, targetBatchId, adminId, override_reason || null]
        );
      } catch (innerErr) {
        throw new Error(`[Step: ${step}] ${innerErr.message}`);
      }
    });

    res.status(200).json({ success: true, message: 'Transition to FYP-II completed successfully.' });
  } catch (error) {
    console.error('transitionBatch error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error transitioning batch.' });
  }
};

const getComplianceDashboard = async (req, res) => {
  try {
    const { batchId } = req.query;
    if (!batchId) return res.status(400).json({ success: false, message: 'Batch ID is required' });

    // Get batch info including its track
    const [batch] = await query(
      'SELECT id, name, track_id, start_date FROM academic_batches WHERE id = ?',
      [batchId]
    );
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    // Total released tasks for this batch's track
    const [taskCount] = await query(
      'SELECT COUNT(*) as total FROM weekly_tasks WHERE track_id = ?',
      [batch.track_id || 0]
    );
    const totalTasks = taskCount?.total || 0;

    // Get all approved proposals in this batch with their submission counts
    const sql = `
      SELECT 
        p.id as group_id,
        p.project_title,
        u.username as lead_name,
        u.sap_id as lead_sap_id,
        u.email as lead_email,
        ? as total_tasks,
        COUNT(DISTINCT ts.id) as completed_tasks
      FROM proposals p
      LEFT JOIN users u ON u.id = p.student_id
      LEFT JOIN task_submissions ts 
        ON ts.proposal_id = p.id 
        AND ts.status IN ('Pending', 'Evaluated', 'Completed')
      WHERE p.batch_id = ? AND p.status = 'approved'
      GROUP BY p.id, p.project_title, u.username
      ORDER BY completed_tasks DESC
    `;
    const complianceData = await query(sql, [totalTasks, batchId]);

    // Fetch granular submissions and members for each group
    const enriched = await Promise.all(complianceData.map(async row => {
      const pct = totalTasks > 0 ? Math.round((row.completed_tasks / totalTasks) * 100) : 0;
      let compliance_status = 'On Track';
      if (totalTasks === 0) compliance_status = 'No Tasks';
      else if (pct < 50) compliance_status = 'Lagging';
      else if (pct < 80) compliance_status = 'Moderate';

      // Fetch Members
      let members = await query(
        'SELECT sap_id, email, status FROM proposal_members WHERE proposal_id = ? AND status = "accepted"',
        [row.group_id]
      ) || [];

      members = [
        { sap_id: row.lead_sap_id, email: row.lead_email, status: 'Lead/Accepted', username: row.lead_name },
        ...members
      ];
      // Include the lead as a member conceptually for full count
      const total_members = members.length + 1;

      // Fetch specific submissions
      const submissions = await query(
        `SELECT ts.id, wt.title, wt.week_number, ts.status, ts.file_url, ts.submitted_at 
         FROM task_submissions ts
         JOIN weekly_tasks wt ON wt.id = ts.task_id
         WHERE ts.proposal_id = ?
         ORDER BY wt.week_number ASC`,
        [row.group_id]
      ) || [];

      return {
        ...row,
        completion_pct: pct,
        compliance_status,
        total_members,
        members_list: members,
        submissions_list: submissions
      };
    }));

    res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('getComplianceDashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving compliance dashboard' });
  }
};


// Get Pre-Activation Checklist
const getPreActivationChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    const [batch] = await query('SELECT * FROM academic_batches WHERE id = ?', [id]);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    const [enrollment] = await query('SELECT COUNT(*) as count FROM users WHERE batch_id = ?', [id]);
    const enrolledStudents = enrollment?.count || 0;

    let trackAssigned = false;
    let totalTasks = 0;
    if (batch.track_id) {
      trackAssigned = true;
      const [tasks] = await query('SELECT COUNT(*) as count FROM weekly_tasks WHERE track_id = ?', [batch.track_id]);
      totalTasks = tasks?.count || 0;
    }

    res.status(200).json({
      success: true,
      data: {
        enrolledStudents,
        trackAssigned,
        totalTasks
      }
    });

  } catch (error) {
    console.error('getPreActivationChecklist error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving checklist' });
  }
};

// Transition Issue Flags
const getTransitionFlags = async (req, res) => {
  try {
    const { batchId } = req.params;
    const sql = `
       SELECT f.*, p.project_title, u.username as flagged_by_name
       FROM transition_issue_flags f
       JOIN proposals p ON f.group_id = p.id
       LEFT JOIN users u ON f.flagged_by = u.id
       WHERE f.batch_id = ?
       ORDER BY f.created_at DESC
    `;
    const flags = await query(sql, [batchId]);
    res.status(200).json({ success: true, data: flags });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving flags' });
  }
};

const flagTransitionIssue = async (req, res) => {
  try {
    const { batchId, groupId, reason } = req.body;
    const flaggedBy = req.user?.id || 1;
    await query(
      'INSERT INTO transition_issue_flags (batch_id, group_id, flagged_by, reason) VALUES (?, ?, ?, ?)',
      [batchId, groupId, flaggedBy, reason]
    );
    res.status(201).json({ success: true, message: 'Issue flagged successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating flag' });
  }
};

const resolveTransitionIssue = async (req, res) => {
  try {
    const { flagId } = req.params;
    await query('UPDATE transition_issue_flags SET is_resolved = TRUE, resolved_at = NOW() WHERE id = ?', [flagId]);
    res.status(200).json({ success: true, message: 'Issue resolved.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error resolving flag' });
  }
};

// GET Student's own batch info (for Profile page)
const getMyBatch = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user] = await query('SELECT batch_id, fyp_phase FROM users WHERE id = ?', [userId]);
    if (!user || !user.batch_id) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'You are not enrolled in any batch yet.'
      });
    }

    const [batch] = await query(`
      SELECT ab.id, ab.name, ab.department, ab.academic_year, ab.fyp_phase, ab.state,
             ab.start_date, ab.results_released, mt.name as track_name
      FROM academic_batches ab
      LEFT JOIN milestone_tracks mt ON ab.track_id = mt.id
      WHERE ab.id = ?
    `, [user.batch_id]);

    res.status(200).json({ success: true, data: batch || null });
  } catch (error) {
    console.error('getMyBatch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching batch info' });
  }
};



// Get Students Enrolled in a Batch
const getBatchStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT id, username, email, sap_id, department
      FROM users
      WHERE batch_id = ? AND role = 'Student'
      ORDER BY username ASC
    `;
    const students = await query(sql, [id]);
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error('getBatchStudents error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving students.' });
  }
};

module.exports = {
  createBatch,
  getBatches,
  updateBatch,
  deleteBatch,
  updateBatchState,
  enrollStudents,
  transitionBatch,
  getComplianceDashboard,
  getPreActivationChecklist,
  getTransitionFlags,
  flagTransitionIssue,
  resolveTransitionIssue,
  getMyBatch,
  getBatchStudents
};
