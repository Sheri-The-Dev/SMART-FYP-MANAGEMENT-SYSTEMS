const { pool } = require('../config/database');

const query = async (sql, values) => {
  const [results] = await pool.query(sql, values);
  return results;
};

// ============================================
// STEP 1: COORDINATOR EVENT SCHEDULING
// ============================================

exports.createPresentation = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { batch_id, presentation_date, presentation_time, venue, group_ids = [] } = req.body;
    if (!batch_id || !presentation_date || !presentation_time || !venue) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Insert presentation
    const [result] = await connection.query(
      'INSERT INTO faculty_presentations (batch_id, presentation_date, presentation_time, venue) VALUES (?, ?, ?, ?)',
      [batch_id, presentation_date, presentation_time, venue]
    );
    const presentationId = result.insertId;

    // Insert group assignments if any
    if (Array.isArray(group_ids) && group_ids.length > 0) {
      for (const proposalId of group_ids) {
        await connection.query(
          'INSERT INTO presentation_group_assignments (presentation_id, proposal_id) VALUES (?, ?)',
          [presentationId, proposalId]
        );
      }
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      message: 'Presentation successfully scheduled.',
      data: { id: presentationId, group_count: group_ids.length }
    });
  } catch (error) {
    await connection.rollback();
    console.error('createPresentation Error:', error);
    res.status(500).json({ success: false, message: 'Server error scheduling presentation.' });
  } finally {
    connection.release();
  }
};

exports.getPresentations = async (req, res) => {
  try {
    const sql = `
      SELECT p.*, b.name as batch_name,
             (SELECT COUNT(*) FROM presentation_group_assignments WHERE presentation_id = p.id) as group_count
      FROM faculty_presentations p
      JOIN academic_batches b ON b.id = p.batch_id
      ORDER BY p.presentation_date DESC, p.presentation_time DESC
    `;
    const presentations = await query(sql);

    // Get group details for each presentation
    for (let presentation of presentations) {
      const groupSql = `
        SELECT pr.id, pr.project_title, pr.status, u.username as lead_name, u.sap_id as lead_sap
        FROM presentation_group_assignments pga
        JOIN proposals pr ON pr.id = pga.proposal_id
        JOIN users u ON u.id = pr.student_id
        WHERE pga.presentation_id = ?
      `;
      const groups = await query(groupSql, [presentation.id]);
      presentation.groups = groups;
    }

    res.status(200).json({ success: true, data: presentations });
  } catch (error) {
    console.error('getPresentations Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving schedules.' });
  }
};

exports.updatePresentation = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { batch_id, presentation_date, presentation_time, venue, group_ids = [] } = req.body;

    // Update presentation details
    await connection.query(
      'UPDATE faculty_presentations SET batch_id = ?, presentation_date = ?, presentation_time = ?, venue = ? WHERE id = ?',
      [batch_id, presentation_date, presentation_time, venue, id]
    );

    // Delete existing group assignments
    await connection.query('DELETE FROM presentation_group_assignments WHERE presentation_id = ?', [id]);

    // Insert new group assignments if any
    if (Array.isArray(group_ids) && group_ids.length > 0) {
      for (const proposalId of group_ids) {
        await connection.query(
          'INSERT INTO presentation_group_assignments (presentation_id, proposal_id) VALUES (?, ?)',
          [id, proposalId]
        );
      }
    }

    await connection.commit();
    res.status(200).json({
      success: true,
      message: 'Presentation successfully updated.',
      data: { group_count: group_ids.length }
    });
  } catch (error) {
    await connection.rollback();
    console.error('updatePresentation Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating presentation.' });
  } finally {
    connection.release();
  }
};

exports.deletePresentation = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM faculty_presentations WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Presentation successfully deleted.' });
  } catch (error) {
    console.error('deletePresentation Error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting presentation.' });
  }
};

// Get groups (proposals) for a batch that haven't been scheduled yet
exports.getUnscheduledGroups = async (req, res) => {
  try {
    const { batch_id } = req.query;
    if (!batch_id) {
      return res.status(400).json({ success: false, message: 'Batch ID is required.' });
    }

    const sql = `
      SELECT p.id, p.project_title, p.status, u.username as lead_name, u.sap_id as lead_sap
      FROM proposals p
      JOIN users u ON u.id = p.student_id
      WHERE p.batch_id = ?
        AND p.status = 'approved'
        AND p.id NOT IN (
          SELECT proposal_id
          FROM presentation_group_assignments pga
          JOIN faculty_presentations fp ON fp.id = pga.presentation_id
          WHERE fp.batch_id = ?
        )
      ORDER BY p.project_title
    `;

    const groups = await query(sql, [batch_id, batch_id]);
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    console.error('getUnscheduledGroups Error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving unscheduled groups.' });
  }
};

// MOCK implementations for other endpoints. They will be completed in later steps.
exports.getPendingEvaluations = async (req, res) => { res.status(200).json({ success: true, data: [] }); };
exports.submitEvaluation = async (req, res) => { res.status(200).json({ success: true, message: 'Evaluation saved' }); };
exports.getMyResult = async (req, res) => { res.status(200).json({ success: true, data: null }); };
exports.exportPresentationsReport = async (req, res) => { res.status(200).json({ success: true, message: 'Report generated' }); };
