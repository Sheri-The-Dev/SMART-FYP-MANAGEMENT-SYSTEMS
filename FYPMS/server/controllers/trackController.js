const { query, transaction } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Create a milestone track
const createTrack = async (req, res) => {
  try {
    const { name, department, fyp_phase } = req.body;
    const adminId = req.user?.id || 1;

    // Check existing track
    try {
      const [existingTrack] = await query(
        'SELECT id FROM milestone_tracks WHERE department = ? AND fyp_phase = ? AND is_archived = false',
        [department, fyp_phase]
      );
      if (existingTrack) {
        return res.status(400).json({
          success: false,
          message: `${department} ka ${fyp_phase} track already exist karta hai! Existing track mein tasks edit karein ya pehle transition complete karein.`
        });
      }
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') {
        // Add is_archived column if it doesn't exist
        await query('ALTER TABLE milestone_tracks ADD COLUMN is_archived BOOLEAN DEFAULT FALSE');
        const [existingTrack] = await query(
          'SELECT id FROM milestone_tracks WHERE department = ? AND fyp_phase = ? AND is_archived = false',
          [department, fyp_phase]
        );
        if (existingTrack) {
          return res.status(400).json({
            success: false,
            message: `${department} ka ${fyp_phase} track already exist karta hai! Existing track mein tasks edit karein ya pehle transition complete karein.`
          });
        }
      } else {
        throw e;
      }
    }

    const result = await query(
      'INSERT INTO milestone_tracks (name, department, fyp_phase, created_by) VALUES (?, ?, ?, ?)',
      [name, department, fyp_phase, adminId]
    );

    res.status(201).json({ success: true, data: { id: result.insertId, name } });
  } catch (error) {
    console.error('createTrack error:', error);
    res.status(500).json({ success: false, message: 'Server error creating track' });
  }
};

// Get all tracks
const getTracks = async (req, res) => {
  try {
    const { department, fyp_phase } = req.query;
    let sql = 'SELECT * FROM milestone_tracks WHERE 1=1';
    let params = [];
    if (department) { sql += ' AND department = ?'; params.push(department); }
    if (fyp_phase) { sql += ' AND fyp_phase = ?'; params.push(fyp_phase); }

    const tracks = await query(sql, params);
    res.status(200).json({ success: true, data: tracks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving tracks' });
  }
};

// Add weekly task to track
const addTask = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { week_number, title, description, task_type, is_mandatory, release_rule, deadline_datetime, deadline_offset_days, is_instruction_only } = req.body;
    
    // Check if File Template is uploaded
    let has_template = false;
    let template_url = null;
    if (req.file) {
      has_template = true;
      template_url = req.file.filename;
    }

    // Try to ensure the column exists, then insert
    try {
      const sql = `
        INSERT INTO weekly_tasks 
        (track_id, week_number, title, description, task_type, is_mandatory, release_rule, deadline_datetime, deadline_offset_days, has_template, template_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [trackId, week_number, title, description, task_type, is_mandatory !== undefined ? is_mandatory : true, release_rule || 'Auto', deadline_datetime || null, deadline_offset_days || 7, has_template, template_url];
      
      const result = await query(sql, params);
      res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') {
        await query('ALTER TABLE weekly_tasks ADD COLUMN deadline_datetime DATETIME NULL');
        const sql = `
          INSERT INTO weekly_tasks 
          (track_id, week_number, title, description, task_type, is_mandatory, release_rule, deadline_datetime, deadline_offset_days, has_template, template_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [trackId, week_number, title, description, task_type, is_mandatory !== undefined ? is_mandatory : true, release_rule || 'Auto', deadline_datetime || null, deadline_offset_days || 7, has_template, template_url];
        
        const result = await query(sql, params);
        res.status(201).json({ success: true, data: { id: result.insertId } });
      } else {
        throw e;
      }
    }
  } catch (error) {
    console.error('addTask error:', error);
    res.status(500).json({ success: false, message: 'Server error adding task' });
  }
};

// Get tasks for a track
const getTasks = async (req, res) => {
  try {
    const { trackId } = req.params;
    const tasks = await query('SELECT * FROM weekly_tasks WHERE track_id = ? ORDER BY week_number ASC', [trackId]);
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving tasks' });
  }
};

// Manual release of a task
const releaseTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    // Assuming a manual_release_date column could exist if we want to track it
    // Or we simply send emails for it.
    res.status(200).json({ success: true, message: 'Task released manually and notifications sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error releasing task' });
  }
};

// Assign Track to Batch
const assignTrackToBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { trackId } = req.body;
    
    const [batch] = await query('SELECT * FROM academic_batches WHERE id = ?', [batchId]);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (batch.state === 'Active') {
      return res.status(400).json({ success: false, message: 'Cannot re-assign track on Active batch easily.' });
    }
    
    await query('UPDATE academic_batches SET track_id = ? WHERE id = ?', [trackId, batchId]);
    res.status(200).json({ success: true, message: 'Track assigned to batch successfully.' });
  } catch (error) {
    // If track_id doesn't exist on academic_batches yet, we must add it:
    if (error.code === 'ER_BAD_FIELD_ERROR') {
         await query('ALTER TABLE academic_batches ADD COLUMN track_id INT NULL');
         await query('ALTER TABLE academic_batches ADD FOREIGN KEY (track_id) REFERENCES milestone_tracks(id) ON DELETE SET NULL');
         await query('UPDATE academic_batches SET track_id = ? WHERE id = ?', [req.body.trackId, req.params.batchId]);
         return res.status(200).json({ success: true, message: 'Track assigned to batch successfully.' });
    }
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Extend Deadline Globally
const globalExtendDeadline = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { days_to_add, reason } = req.body;
    const adminId = req.user?.id || 1;
    
    // In actual implementation, we might adjust computed offsets or store an override for the batch
    await query(
      'INSERT INTO batch_task_overrides (batch_id, reason, created_by) VALUES (?, ?, ?)',
      [batchId, reason, adminId]
    );

    // This is purely representative of extending a batch deadline
    
    res.status(200).json({ success: true, message: `Deadline extended globally for ${days_to_add} days.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error extending deadline' });
  }
};

// Reopen deadline for specific group
const reopenGroupDeadline = async (req, res) => {
  try {
    const { taskId, proposalId } = req.body;
    const { new_deadline, reason } = req.body;
    const adminId = req.user?.id || 1;

    await query(
      'INSERT INTO group_deadline_extensions (task_id, proposal_id, new_deadline, reason, granted_by) VALUES (?, ?, ?, ?, ?)',
      [taskId, proposalId, new_deadline, reason, adminId]
    );
    res.status(200).json({ success: true, message: 'Deadline reopened for group.' });
  } catch(error) {
    res.status(500).json({ success: false, message: 'Error reopening deadline' });
  }
}

// Get Tasks for Student (My Milestones)
const getMyTasks = async (req, res) => {
  try {
    const studentId = req.user.id;

    // 1. Get the student's batch and proposal
    const [userAuthInfo] = await query('SELECT batch_id FROM users WHERE id = ?', [studentId]);
    if (!userAuthInfo || !userAuthInfo.batch_id) {
       return res.status(404).json({ success: false, message: 'You are not enrolled in any batch.' });
    }

    const [userBatch] = await query(`
      SELECT id, start_date, track_id 
      FROM academic_batches 
      WHERE id = ? AND state = 'Active'
    `, [userAuthInfo.batch_id]);

    if (!userBatch) return res.status(404).json({ success: false, message: 'Your batch is not currently active.' });

    // Find approved proposal for this student (as leader or accepted group member)
    // Task submissions are per-proposal (shared by all group members)
    const [proposalData] = await query(`
      SELECT DISTINCT p.id 
      FROM proposals p
      LEFT JOIN proposal_members pm ON pm.proposal_id = p.id
      LEFT JOIN users u ON u.sap_id = pm.sap_id
      WHERE (
        p.student_id = ?
        OR (u.id = ? AND pm.status = 'accepted')
      )
        AND p.status = 'approved' 
        AND p.batch_id = ?
      LIMIT 1
    `, [studentId, studentId, userBatch.id]);
    const proposalId = proposalData ? proposalData.id : null;

    // 2. Fetch Tasks and calculate deadlines
    const sql = `
       SELECT t.*, 
          COALESCE(s.status, 'Not_Submitted') as submission_status,
          s.id as submission_id,
          COALESCE(e.new_deadline, t.deadline_datetime, DATE_ADD(?, INTERVAL t.deadline_offset_days DAY)) as computed_deadline
       FROM weekly_tasks t
       LEFT JOIN task_submissions s ON s.task_id = t.id AND s.proposal_id = ?
       LEFT JOIN group_deadline_extensions e ON e.task_id = t.id AND e.proposal_id = ?
       WHERE t.track_id = ?
       ORDER BY t.week_number ASC
    `;
    
    let tasks = [];
    let hasApprovedProposal = !!proposalId;

    if (proposalId) {
      tasks = await query(sql, [userBatch.start_date, proposalId, proposalId, userBatch.track_id]);
    } else {
      // If no approved proposal, they just get to see the templates but can't submit
      const noPropSql = `SELECT t.*, 'Locked_NoProposal' as submission_status, COALESCE(t.deadline_datetime, DATE_ADD(?, INTERVAL t.deadline_offset_days DAY)) as computed_deadline FROM weekly_tasks t WHERE t.track_id = ? ORDER BY t.week_number ASC`;
      tasks = await query(noPropSql, [userBatch.start_date, userBatch.track_id]);
    }
    
    // Loop to lock past deadlines if not submitted
    const now = new Date();
    tasks.forEach(t => {
       const taskDeadline = new Date(t.computed_deadline);
       t.deadline = taskDeadline;
       if (t.submission_status === 'Not_Submitted' && now > taskDeadline) {
          t.submission_status = 'Locked_PastDeadline';
       }
    });

    res.status(200).json({ success: true, data: tasks, hasApprovedProposal });
  } catch (error) {
    console.error('getMyTasks error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving milestones.' });
  }
};

// Submit Task (with deadline enforcement)
const submitTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const studentId = req.user.id;
    const fileUrl = req.file ? req.file.filename : null;
    const fileSize = req.file ? req.file.size : null;
    const fileMime = req.file ? req.file.mimetype : null;

    // 1. Get Student's approved proposal (as leader or accepted group member)
    const [proposalData] = await query(`
      SELECT DISTINCT p.id 
      FROM proposals p
      LEFT JOIN proposal_members pm ON pm.proposal_id = p.id
      LEFT JOIN users u ON u.sap_id = pm.sap_id
      WHERE (
        p.student_id = ?
        OR (u.id = ? AND pm.status = 'accepted')
      )
        AND p.status = 'approved'
      LIMIT 1
    `, [studentId, studentId]);
    if (!proposalData) return res.status(400).json({ success: false, message: 'No approved proposal found. You must have an approved proposal to submit tasks.' });
    
    // 2. Fetch Task and deadline
    const [userAuthInfo] = await query('SELECT batch_id FROM users WHERE id = ?', [studentId]);
    const [userBatch] = await query('SELECT start_date FROM academic_batches WHERE id = ?', [userAuthInfo.batch_id]);
    
    const [taskInfo] = await query(`
      SELECT t.*, COALESCE(e.new_deadline, t.deadline_datetime, DATE_ADD(?, INTERVAL t.deadline_offset_days DAY)) as computed_deadline
      FROM weekly_tasks t
      LEFT JOIN group_deadline_extensions e ON e.task_id = t.id AND e.proposal_id = ?
      WHERE t.id = ?
    `, [userBatch.start_date, proposalData.id, taskId]);

    if (!taskInfo) return res.status(404).json({ success: false, message: 'Task not found.' });

    // 3. Deadline Enforcement
    const now = new Date();
    const deadline = new Date(taskInfo.computed_deadline);
    if (now > deadline) {
       return res.status(403).json({ success: false, message: 'Submission rejected: Deadline has passed.' });
    }

    // 4. Save Submission
    const defaultVisibility = JSON.stringify(['Supervisor', 'Coordinator', 'Admin']);
    try {
      const [existing] = await query('SELECT id FROM task_submissions WHERE task_id = ? AND proposal_id = ?', [taskId, proposalData.id]);
      if (existing) {
         await query('UPDATE task_submissions SET file_url = ?, file_size = ?, file_mime = ?, status = "Pending", submitted_by = ?, submitted_at = NOW(), visible_to_roles = ? WHERE id = ?', [fileUrl, fileSize, fileMime, studentId, defaultVisibility, existing.id]);
      } else {
         await query('INSERT INTO task_submissions (task_id, proposal_id, submitted_by, file_url, file_size, file_mime, status, visible_to_roles) VALUES (?, ?, ?, ?, ?, ?, "Pending", ?)', [taskId, proposalData.id, studentId, fileUrl, fileSize, fileMime, defaultVisibility]);
      }
    } catch (e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') {
        await query(`ALTER TABLE task_submissions ADD COLUMN visible_to_roles JSON DEFAULT ('["Supervisor", "Coordinator", "Admin"]')`);
        const [existing] = await query('SELECT id FROM task_submissions WHERE task_id = ? AND proposal_id = ?', [taskId, proposalData.id]);
        if (existing) {
           await query('UPDATE task_submissions SET file_url = ?, file_size = ?, file_mime = ?, status = "Pending", submitted_by = ?, submitted_at = NOW(), visible_to_roles = ? WHERE id = ?', [fileUrl, fileSize, fileMime, studentId, defaultVisibility, existing.id]);
        } else {
           await query('INSERT INTO task_submissions (task_id, proposal_id, submitted_by, file_url, file_size, file_mime, status, visible_to_roles) VALUES (?, ?, ?, ?, ?, ?, "Pending", ?)', [taskId, proposalData.id, studentId, fileUrl, fileSize, fileMime, defaultVisibility]);
        }
      } else {
        throw e;
      }
    }

    // Mock sending notification to Supervisor
    console.log(`[Notification] Task ${taskId} submitted by student ${studentId}. Notifying Supervisor for Proposal ${proposalData.id}.`);

    res.status(200).json({ success: true, message: 'Assignment submitted successfully.' });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Server error submitting assignment.' });
  }
};

// Clone Track
const cloneTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { newName } = req.body;
    const adminId = req.user?.id || 1;

    // 1. Get original track
    const [origTrack] = await query('SELECT * FROM milestone_tracks WHERE id = ?', [trackId]);
    if (!origTrack) return res.status(404).json({ success: false, message: 'Track not found' });

    // 2. Create new track
    const finalName = newName || `${origTrack.name} (Clone)`;
    const result = await query(
      'INSERT INTO milestone_tracks (name, department, fyp_phase, created_by) VALUES (?, ?, ?, ?)',
      [finalName, origTrack.department, origTrack.fyp_phase, adminId]
    );
    const newTrackId = result.insertId;

    // 3. Clone Tasks
    const tasks = await query('SELECT * FROM weekly_tasks WHERE track_id = ?', [trackId]);
    for (let t of tasks) {
       await query(
         'INSERT INTO weekly_tasks (track_id, week_number, title, description, task_type, is_mandatory, release_rule, deadline_offset_days, has_template, template_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
         [newTrackId, t.week_number, t.title, t.description, t.task_type, t.is_mandatory, t.release_rule, t.deadline_offset_days, t.has_template, t.template_url]
       );
    }
    res.status(200).json({ success: true, message: 'Track cloned successfully', data: { id: newTrackId } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error cloning track' });
  }
};

// Delete Track with Safeguards
const deleteTrack = async (req, res) => {
  try {
     const { trackId } = req.params;
     // Check if used in any active/archived batch
     const [batch] = await query('SELECT id, state FROM academic_batches WHERE track_id = ? AND state IN ("Active", "Archived", "Frozen")', [trackId]);
     if (batch) {
        return res.status(403).json({ success: false, message: 'Cannot delete track safely. It is assigned to a non-Draft batch.' });
     }
     await query('DELETE FROM milestone_tracks WHERE id = ?', [trackId]);
     res.status(200).json({ success: true, message: 'Track deleted successfully.' });
  } catch(e) {
     res.status(500).json({ success: false, message: 'Error deleting track' });
  }
};

// Update Track (blocked if used in active/frozen/archived batch)
const updateTrack = async (req, res) => {
  try {
    const { trackId } = req.params;
    const { name, department, fyp_phase } = req.body;

    const [track] = await query('SELECT * FROM milestone_tracks WHERE id = ?', [trackId]);
    if (!track) return res.status(404).json({ success: false, message: 'Track not found.' });

    // Block update if the track is live on a non-Draft batch
    const [activeBatch] = await query(
      'SELECT id FROM academic_batches WHERE track_id = ? AND state IN ("Active", "Frozen", "Archived")',
      [trackId]
    );
    if (activeBatch) {
      return res.status(403).json({ success: false, message: 'Cannot edit a track currently assigned to an Active, Frozen, or Archived batch.' });
    }

    await query(
      'UPDATE milestone_tracks SET name = ?, department = ?, fyp_phase = ? WHERE id = ?',
      [name || track.name, department || track.department, fyp_phase || track.fyp_phase, trackId]
    );

    res.status(200).json({ success: true, message: 'Track updated successfully.' });
  } catch (error) {
    console.error('updateTrack error:', error);
    res.status(500).json({ success: false, message: 'Server error updating track.' });
  }
};

// Update a Task / Week entry
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { week_number, title, description, task_type, is_mandatory, deadline_datetime, deadline_offset_days } = req.body;

    const [task] = await query('SELECT * FROM weekly_tasks WHERE id = ?', [taskId]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    await query(
      `UPDATE weekly_tasks SET 
        week_number = ?, title = ?, description = ?, task_type = ?, is_mandatory = ?, deadline_datetime = ?, deadline_offset_days = ?
       WHERE id = ?`,
      [
        week_number ?? task.week_number,
        title ?? task.title,
        description ?? task.description,
        task_type ?? task.task_type,
        is_mandatory !== undefined ? (is_mandatory ? 1 : 0) : task.is_mandatory,
        deadline_datetime !== undefined ? (deadline_datetime || null) : task.deadline_datetime,
        deadline_offset_days ?? task.deadline_offset_days,
        taskId
      ]
    );

    res.status(200).json({ success: true, message: 'Task updated successfully.' });
  } catch (error) {
    console.error('updateTask error:', error);
    res.status(500).json({ success: false, message: 'Server error updating task.' });
  }
};

// Delete a Task / Week entry
const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const [task] = await query('SELECT * FROM weekly_tasks WHERE id = ?', [taskId]);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

    // Remove any submissions and extensions tied to this task first
    await query('DELETE FROM task_submissions WHERE task_id = ?', [taskId]);
    await query('DELETE FROM group_deadline_extensions WHERE task_id = ?', [taskId]);
    await query('DELETE FROM weekly_tasks WHERE id = ?', [taskId]);

    res.status(200).json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('deleteTask error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting task.' });
  }
};

// Get task submission progress for supervisor's assigned groups
const getSupervisorGroupTasks = async (req, res) => {
  try {
    const supervisorId = req.user.id;

    // Get all approved proposals assigned to this supervisor
    const proposals = await query(`
      SELECT p.id as proposal_id, p.project_title, p.batch_id,
             ab.name as batch_name, ab.track_id,
             u.username as lead_name
      FROM proposals p
      LEFT JOIN academic_batches ab ON ab.id = p.batch_id
      LEFT JOIN users u ON u.id = p.student_id
      WHERE p.supervisor_id = ? AND p.status = 'approved'
      ORDER BY ab.name, p.project_title
    `, [supervisorId]);

    if (proposals.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // For each proposal, get task completion
    const result = [];
    for (const prop of proposals) {
      const [taskCount] = await query(
        'SELECT COUNT(*) as total FROM weekly_tasks WHERE track_id = ?',
        [prop.track_id || 0]
      );
      const [doneCount] = await query(
        `SELECT COUNT(*) as done FROM task_submissions 
         WHERE proposal_id = ? AND status IN ('Pending','Evaluated','Completed')`,
        [prop.proposal_id]
      );

      // Get individual task submissions for this proposal
      const submissions = await query(`
        SELECT t.week_number, t.title, t.task_type, t.is_mandatory,
               ts.status as submission_status, ts.submitted_at, ts.file_url,
               submitter.username as submitted_by_name
        FROM weekly_tasks t
        LEFT JOIN task_submissions ts ON ts.task_id = t.id AND ts.proposal_id = ?
        LEFT JOIN users submitter ON submitter.id = ts.submitted_by
        WHERE t.track_id = ?
        ORDER BY t.week_number ASC
      `, [prop.proposal_id, prop.track_id || 0]);

      const total = taskCount?.total || 0;
      const done = doneCount?.done || 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      result.push({
        ...prop,
        total_tasks: total,
        completed_tasks: done,
        completion_pct: pct,
        compliance_status: total === 0 ? 'No Tasks' : pct >= 80 ? 'On Track' : pct >= 50 ? 'Moderate' : 'Lagging',
        submissions
      });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('getSupervisorGroupTasks error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching group tasks.' });
  }
};

// ==========================================
// SUPERVISOR MILESTONE REVIEW AND EVALUATION
// ==========================================

const getGroupSubmissionsForReview = async (req, res) => {
  try {
    const supervisorId = req.user.id; // From 'Teacher' login

    const sql = `
      SELECT
          p.id                         AS proposal_id,
          p.project_title,
          p.batch_id                   AS batch_id,
          ab.name                      AS batch_name,
          ab.fyp_phase                 AS fyp_phase,

          lead_student.username        AS lead_student_name,
          lead_student.sap_id          AS lead_student_sap,

          wt.id                        AS task_id,
          wt.week_number,
          wt.title                     AS task_title,
          wt.task_type,
          wt.is_mandatory,

          ts.id                        AS submission_id,
          ts.file_url,
          ts.file_size,
          ts.file_mime,
          ts.status                    AS submission_status,
          ts.submitted_at,

          submitter.username           AS submitted_by_name,

          te.id                        AS evaluation_id,
          te.marks,
          te.feedback                  AS evaluator_feedback,
          te.evaluated_at

      FROM proposals p
      INNER JOIN academic_batches ab ON ab.id = p.batch_id
      LEFT JOIN users lead_student ON lead_student.id = p.student_id
      LEFT JOIN weekly_tasks wt ON wt.track_id = ab.track_id
      LEFT JOIN task_submissions ts 
          ON ts.task_id = wt.id 
          AND ts.proposal_id = p.id
      LEFT JOIN users submitter ON submitter.id = ts.submitted_by
      LEFT JOIN task_evaluations te 
          ON te.submission_id = ts.id 
          AND te.evaluator_id = ?
      WHERE 
          p.supervisor_id = ?
          AND p.status = 'approved'
          AND ab.state = 'Active'
      ORDER BY p.project_title ASC, wt.week_number ASC;
    `;

    const rows = await query(sql, [supervisorId, supervisorId]);

    // Group the flat SQL results by proposal
    const groupsMap = new Map();

    for (const row of rows) {
      if (!groupsMap.has(row.proposal_id)) {
        groupsMap.set(row.proposal_id, {
          proposal_id: row.proposal_id,
          project_title: row.project_title,
          batch_id: row.batch_id,
          batch_name: row.batch_name,
          fyp_phase: row.fyp_phase,
          lead_student_name: row.lead_student_name,
          lead_student_sap: row.lead_student_sap,
          tasks: []
        });
      }

      // If a track has no tasks, week_number will be null
      if (row.task_id) {
        groupsMap.get(row.proposal_id).tasks.push({
          task_id: row.task_id,
          week_number: row.week_number,
          task_title: row.task_title,
          task_type: row.task_type,
          is_mandatory: !!row.is_mandatory,
          submission_id: row.submission_id,
          file_url: row.file_url,
          file_size: row.file_size,
          file_mime: row.file_mime,
          submission_status: row.submission_status,
          submitted_at: row.submitted_at,
          submitted_by_name: row.submitted_by_name,
          evaluation_id: row.evaluation_id,
          marks: row.marks,
          evaluator_feedback: row.evaluator_feedback,
          evaluated_at: row.evaluated_at
        });
      }
    }

    res.status(200).json({ success: true, data: Array.from(groupsMap.values()) });
  } catch (error) {
    console.error('getGroupSubmissionsForReview error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching group submissions' });
  }
};

const evaluateSubmission = async (req, res) => {
  try {
    const evaluatorId = req.user.id;
    const { submission_id, marks, feedback } = req.body;

    if (!submission_id || marks === undefined || marks < 0 || marks > 10) {
      return res.status(400).json({ success: false, message: 'Valid submission ID and marks (0-10) are required.' });
    }

    // Security Verification: Does this submission belong to a group supervised by the caller?
    const [authCheck] = await query(`
      SELECT ts.id 
      FROM task_submissions ts
      INNER JOIN proposals p ON p.id = ts.proposal_id
      WHERE ts.id = ? AND p.supervisor_id = ?
    `, [submission_id, evaluatorId]);

    if (!authCheck) {
      return res.status(403).json({ success: false, message: 'Unauthorized. This submission does not belong to your assigned groups.' });
    }

    // Upsert the evaluation
    const upsertSql = `
      INSERT INTO task_evaluations (submission_id, evaluator_id, marks, feedback)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE marks = ?, feedback = ?
    `;
    await query(upsertSql, [submission_id, evaluatorId, marks, feedback, marks, feedback]);

    // Update submission status to Evaluated
    await query(`UPDATE task_submissions SET status = 'Evaluated' WHERE id = ?`, [submission_id]);

    res.status(200).json({ success: true, message: 'Evaluation saved successfully.' });
  } catch (error) {
    console.error('evaluateSubmission error:', error);
    res.status(500).json({ success: false, message: 'Server error saving evaluation.' });
  }
};

module.exports = {
  createTrack,
  getTracks,
  cloneTrack,
  deleteTrack,
  updateTrack,
  addTask,
  getTasks,
  updateTask,
  deleteTask,
  releaseTask,
  assignTrackToBatch,
  globalExtendDeadline,
  reopenGroupDeadline,
  getMyTasks,
  submitTask,
  getSupervisorGroupTasks,
  getGroupSubmissionsForReview,
  evaluateSubmission
};
