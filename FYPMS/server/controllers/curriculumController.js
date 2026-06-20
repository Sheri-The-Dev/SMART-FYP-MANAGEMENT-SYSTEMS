const fs = require('fs');
const { query, transaction } = require('../config/database');

// Create Academic Batch
const createBatch = async (req, res) => {
  try {
    const { name, department, academic_year: academicYearParam, fyp_phase, start_date } = req.body;
    const adminId = req.user?.id || 1; // Assuming adminId from auth middleware

    const academic_year = parseInt(academicYearParam, 10);
    if (isNaN(academic_year)) {
      return res.status(400).json({ success: false, message: 'Invalid Academic Year provided.' });
    }

    const sql = `
      INSERT INTO academic_batches (name, department, academic_year, fyp_phase, state, start_date, created_by)
      VALUES (?, ?, ?, ?, 'Draft', ?, ?)
    `;
    const [result] = await query(sql, [name, department, academic_year, fyp_phase, start_date, adminId]);

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
    res.status(500).json({ success: false, message: 'Server error creating batch.', error: error.message });
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
    const [batches] = await query(sql);
    res.status(200).json({ success: true, data: batches });
  } catch (error) {
    console.error('getBatches error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching batches.', error: error.message });
  }
};

// Update Batch State
const updateBatchState = async (req, res) => {
  try {
    const { id: idParam } = req.params;
    const { state } = req.body;

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
    }

    const [batch] = await query('SELECT * FROM academic_batches WHERE id = ?', [id]);
    if (!batch || batch.length === 0) return res.status(404).json({ success: false, message: 'Batch not found' });
    const batchData = batch[0];

    // Enforce logic: Only one batch per dept per phase can be Active
    if (state === 'Active') {
      const activeBatchesSql = `
        SELECT id FROM academic_batches 
        WHERE department = ? AND fyp_phase = ? AND state = 'Active' AND id != ?
      `;
      const [activeBatches] = await query(activeBatchesSql, [batchData.department, batchData.fyp_phase, id]);
      if (activeBatches.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'An active batch already exists for this department and phase. Please archive/freeze it first.'
        });
      }

      // Pre-activation checklist enforcement
      if (!batchData.track_id) {
        return res.status(400).json({ success: false, message: 'Cannot activate: Milestone Track is not assigned.' });
      }

      const [enrollment] = await query('SELECT COUNT(*) as count FROM users WHERE batch_id = ?', [id]);
      if (enrollment?.[0]?.count === 0) {
        return res.status(400).json({ success: false, message: 'Cannot activate: No students are enrolled.' });
      }

      // Automatically assign phase to all enrolled students
      await query('UPDATE users SET fyp_phase = ? WHERE batch_id = ?', [batchData.fyp_phase, id]);
    }

    await query('UPDATE academic_batches SET state = ? WHERE id = ?', [state, id]);

    // Log state change
    // Using simple console log or existing logAudit structure if required, assuming it's done elsewhere or via triggers

    res.status(200).json({ success: true, message: `Batch state updated to ${state}` });
  } catch (error) {
    console.error('updateBatchState error:', error);
    res.status(500).json({ success: false, message: 'Server error updating batch state.', error: error.message });
  }
};

// Enroll Students via CSV (expects req.file with an 'email' column)
const enrollStudents = async (req, res) => {
  try {
    const { batchId: batchIdParam } = req.body;

    const batchId = parseInt(batchIdParam, 10);
    if (isNaN(batchId)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
    }

    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required' });
    if (!batchIdParam) return res.status(400).json({ success: false, message: 'Batch ID required' });

    const [batch] = await query('SELECT * FROM academic_batches WHERE id = ?', [batchId]);
    if (!batch || batch.length === 0) return res.status(404).json({ success: false, message: 'Batch not found' });
    const batchData = batch[0];

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

        if (batchData.department !== 'All Departments' && (u.department || '').toLowerCase() !== batchData.department.toLowerCase()) {
          errors.push(`Row ${i + 1}: Department Mismatch Error! Student belongs to ${u.department || 'Unassigned'}, but this Batch is strictly for ${batchData.department}.`);
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

        await connection.query('UPDATE users SET batch_id = ?, fyp_phase = ? WHERE id = ?', [batchId, batchData.fyp_phase, u.id]);
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
    res.status(500).json({ success: false, message: 'Server error enrolling students.', error: error.message });
  }
};

// Update Batch (Draft only)
const updateBatch = async (req, res) => {
  try {
    const { id: idParam } = req.params;
    const { name, department, academic_year: academicYearParam, fyp_phase, start_date } = req.body;

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
    }

    const academic_year = parseInt(academicYearParam, 10);
    if (isNaN(academic_year)) {
      return res.status(400).json({ success: false, message: 'Invalid Academic Year provided.' });
    }

    const [batch] = await query('SELECT * FROM academic_batches WHERE id = ?', [id]);
    if (!batch || batch.length === 0) return res.status(404).json({ success: false, message: 'Batch not found.' });
    const batchData = batch[0];

    if (batchData.state !== 'Draft') {
      return res.status(403).json({ success: false, message: 'Only Draft batches can be edited.' });
    }

    await query(
      `UPDATE academic_batches SET name = ?, department = ?, academic_year = ?, fyp_phase = ?, start_date = ? WHERE id = ?`,
      [name || batchData.name, department || batchData.department, academic_year || batchData.academic_year, fyp_phase || batchData.fyp_phase, start_date || batchData.start_date, id]
    );

    res.status(200).json({ success: true, message: 'Batch updated successfully.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Batch name must be unique.' });
    }
    console.error('updateBatch error:', error);
    res.status(500).json({ success: false, message: 'Server error updating batch.', error: error.message });
  }
};

// Delete Batch
const deleteBatch = async (req, res) => {
  try {
    const { id: idParam } = req.params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
    }

    const [batch] = await query('SELECT * FROM academic_batches WHERE id = ?', [id]);
    if (!batch || batch.length === 0) return res.status(404).json({ success: false, message: 'Batch not found.' });
    const batchData = batch[0];

    if (batchData.state === 'Frozen') {
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
    res.status(500).json({ success: false, message: 'Server error deleting batch.', error: error.message });
  }
};

// FYP-I to FYP-II Transition
const transitionBatch = async (req, res) => {
  try {
    const { sourceBatchId: sourceBatchIdParam } = req.body;
    const adminId = req.user?.id || 1;

    const sourceBatchId = parseInt(sourceBatchIdParam, 10);
    if (isNaN(sourceBatchId)) {
      return res.status(400).json({ success: false, message: 'Invalid Source Batch ID provided.' });
    }

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
          const supervisorIds = supervisorRows.map(s => parseInt(s.supervisor_id, 10)).filter(id => !isNaN(id));
          if (supervisorIds.length > 0) {
            const placeholders = supervisorIds.map(() => '?').join(',');
            await connection.query(
              `UPDATE users SET current_supervisees = 0 WHERE id IN (${placeholders})`,
              supervisorIds
            );
          }
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
    res.status(500).json({ success: false, message: error.message || 'Server error transitioning batch.', error: error.message });
  }
};

const getComplianceDashboard = async (req, res) => {
  try {
    const { batchId: batchIdParam } = req.query;
    if (!batchIdParam) return res.status(400).json({ success: false, message: 'Batch ID is required' });

    const batchId = parseInt(batchIdParam, 10);
    if (isNaN(batchId)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
    }

    // Get batch info including its track
    const [batch] = await query(
      'SELECT id, name, track_id, start_date FROM academic_batches WHERE id = ?',
      [batchId]
    );
    if (!batch || batch.length === 0) return res.status(404).json({ success: false, message: 'Batch not found' });
    const batchData = batch[0];

    // Total released tasks for this batch's track
    const [taskCount] = await query(
      'SELECT COUNT(*) as total FROM weekly_tasks WHERE track_id = ?',
      [batchData.track_id || 0]
    );
    const totalTasks = taskCount?.[0]?.total || 0;

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
    const [complianceData] = await query(sql, [totalTasks, batchId]);

    // Fetch granular submissions and members for each group
    const enriched = await Promise.all(complianceData.map(async row => {
      const pct = totalTasks > 0 ? Math.round((row.completed_tasks / totalTasks) * 100) : 0;
      let compliance_status = 'On Track';
      if (totalTasks === 0) compliance_status = 'No Tasks';
      else if (pct < 50) compliance_status = 'Lagging';
      else if (pct < 80) compliance_status = 'Moderate';

      // Fetch Members
      let [members] = await query(
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
      const [submissions] = await query(
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
    res.status(500).json({ success: false, message: 'Server error retrieving compliance dashboard', error: error.message });
  }
};


// Get Pre-Activation Checklist
const getPreActivationChecklist = async (req, res) => {
  try {
    const { id: idParam } = req.params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
    }

    const [batch] = await query('SELECT * FROM academic_batches WHERE id = ?', [id]);
    if (!batch || batch.length === 0) return res.status(404).json({ success: false, message: 'Batch not found' });
    const batchData = batch[0];

    const [enrollment] = await query('SELECT COUNT(*) as count FROM users WHERE batch_id = ?', [id]);
    const enrolledStudents = enrollment?.[0]?.count || 0;

    let trackAssigned = false;
    let totalTasks = 0;
    if (batchData.track_id) {
      trackAssigned = true;
      const [tasks] = await query('SELECT COUNT(*) as count FROM weekly_tasks WHERE track_id = ?', [batchData.track_id]);
      totalTasks = tasks?.[0]?.count || 0;
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
    res.status(500).json({ success: false, message: 'Server error retrieving checklist', error: error.message });
  }
};

// Transition Issue Flags
const getTransitionFlags = async (req, res) => {
  try {
    const { batchId: batchIdParam } = req.params;
    const batchId = parseInt(batchIdParam, 10);
    if (isNaN(batchId)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
    }

    const sql = `
       SELECT f.*, p.project_title, u.username as flagged_by_name
       FROM transition_issue_flags f
       JOIN proposals p ON f.group_id = p.id
       LEFT JOIN users u ON f.flagged_by = u.id
       WHERE f.batch_id = ?
       ORDER BY f.created_at DESC
    `;
    const [flags] = await query(sql, [batchId]);
    res.status(200).json({ success: true, data: flags });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving flags', error: error.message });
  }
};

const flagTransitionIssue = async (req, res) => {
  try {
    const { batchId: batchIdParam, groupId: groupIdParam, reason } = req.body;
    const flaggedBy = req.user?.id || 1;

    const batchId = parseInt(batchIdParam, 10);
    const groupId = parseInt(groupIdParam, 10);

    if (isNaN(batchId) || isNaN(groupId)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID or Group ID provided.' });
    }

    await query(
      'INSERT INTO transition_issue_flags (batch_id, group_id, flagged_by, reason) VALUES (?, ?, ?, ?)',
      [batchId, groupId, flaggedBy, reason]
    );
    res.status(201).json({ success: true, message: 'Issue flagged successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error creating flag', error: error.message });
  }
};

const resolveTransitionIssue = async (req, res) => {
  try {
    const { flagId: flagIdParam } = req.params;
    const flagId = parseInt(flagIdParam, 10);
    if (isNaN(flagId)) {
      return res.status(400).json({ success: false, message: 'Invalid Flag ID provided.' });
    }

    await query('UPDATE transition_issue_flags SET is_resolved = TRUE, resolved_at = NOW() WHERE id = ?', [flagId]);
    res.status(200).json({ success: true, message: 'Issue resolved.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error resolving flag', error: error.message });
  }
};

// GET Student's own batch info (for Profile page)
const getMyBatch = async (req, res) => {
  try {
    const userId = req.user.id;

    const [user] = await query('SELECT batch_id, fyp_phase FROM users WHERE id = ?', [userId]);
    if (!user || user.length === 0 || !user[0].batch_id) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'You are not enrolled in any batch yet.'
      });
    }

    const batchId = parseInt(user[0].batch_id, 10);
    if (isNaN(batchId)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID in user record.' });
    }

    const [batch] = await query(`
      SELECT ab.id, ab.name, ab.department, ab.academic_year, ab.fyp_phase, ab.state,
             ab.start_date, ab.results_released, mt.name as track_name
      FROM academic_batches ab
      LEFT JOIN milestone_tracks mt ON ab.track_id = mt.id
      WHERE ab.id = ?
    `, [batchId]);

    res.status(200).json({ success: true, data: batch?.[0] || null });
  } catch (error) {
    console.error('getMyBatch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching batch info', error: error.message });
  }
};



// Get Students Enrolled in a Batch
const getBatchStudents = async (req, res) => {
  try {
    const { id: idParam } = req.params;
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
    }

    const sql = `
      SELECT id, username, email, sap_id, department
      FROM users
      WHERE batch_id = ? AND role = 'Student'
      ORDER BY username ASC
    `;
    const [students] = await query(sql, [id]);
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    console.error('getBatchStudents error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving students.', error: error.message });
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
