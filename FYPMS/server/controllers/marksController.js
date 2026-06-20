const { pool } = require('../config/database');

// Module 11: Supervisor Marks Entry - Fetch Students
const getSupervisorStudentsForMarks = async (req, res) => {
    try {
        const { batch_id } = req.params;
        const supervisor_id = req.user.id;
        
        const phase = req.query.phase || 'FYP-I'; 

        const parsedBatchId = parseInt(batch_id, 10);

        if (isNaN(parsedBatchId) && batch_id !== 'all') {
            return res.status(400).json({ success: false, message: 'Invalid Batch ID provided' });
        }
        if (!batch_id) {
            return res.status(400).json({ success: false, message: 'Batch ID is required' });
        }

        const [rows] = await pool.query(`
            SELECT 
                p.batch_id                            AS batch_id,
                p.id                                  AS proposal_id,
                p.project_title                       AS project_title,
                u.sap_id                              AS student_sap_id,
                u.username                            AS student_name,
                IF(u.id = p.student_id, 'Leader', 'Member') AS student_role,
                COALESCE(sm.status, 'NOT_STARTED')    AS evaluation_status,
                sm.id                                 AS marks_id,
                sm.lo1_marks, sm.lo2_marks, sm.lo3_marks, sm.lo4_marks,
                sm.lo5_marks, sm.lo6_marks, sm.lo7_marks, sm.lo8_marks,
                sm.total_marks,
                EXISTS (
                    SELECT 1 
                    FROM defense_submissions ds 
                    WHERE ds.proposal_id = p.id 
                    AND ds.submission_status = 'evaluated'
                ) AS is_committee_done
            FROM proposals p
            JOIN users u 
                ON u.id = p.student_id 
                OR u.sap_id COLLATE utf8mb4_unicode_ci IN (
                    SELECT sap_id COLLATE utf8mb4_unicode_ci 
                    FROM proposal_members 
                    WHERE proposal_id = p.id AND status = 'accepted'
                )
            LEFT JOIN supervisor_marks sm 
                ON  p.id          = sm.proposal_id 
                AND u.sap_id COLLATE utf8mb4_unicode_ci = sm.student_sap_id COLLATE utf8mb4_unicode_ci
                AND sm.fyp_phase  = ?
            WHERE p.status       = 'approved'
              AND (p.supervisor_id = ? OR p.supervisor_sap_id COLLATE utf8mb4_unicode_ci = ?)
              ${batch_id !== 'all' ? 'AND p.batch_id = ?' : ''}
            ORDER BY p.batch_id, p.id, student_role DESC, u.username
        `, batch_id !== 'all' ? [phase, supervisor_id, req.user.sap_id || null, parsedBatchId] : [phase, supervisor_id, req.user.sap_id || null]);

        // Reshape rows into a nested JSON structure: Group -> Students[]
        const groupsMap = {};

        rows.forEach(row => {
            if (!groupsMap[row.proposal_id]) {
                groupsMap[row.proposal_id] = {
                    proposal_id:   row.proposal_id,
                    project_title: row.project_title,
                    batch_id:      row.batch_id,
                    is_committee_done: !!row.is_committee_done,
                    students: []
                };
            }

            groupsMap[row.proposal_id].students.push({
                sap_id:            row.student_sap_id,
                name:              row.student_name,
                role:              row.student_role,
                evaluation_status: row.evaluation_status,
                marks_id:          row.marks_id,
                lo_marks: {
                    lo1: row.lo1_marks, lo2: row.lo2_marks, lo3: row.lo3_marks, lo4: row.lo4_marks,
                    lo5: row.lo5_marks, lo6: row.lo6_marks, lo7: row.lo7_marks, lo8: row.lo8_marks
                },
                total_marks:       row.total_marks
            });
        });

        // Check if an evaluation session is active for the batch and phase
        const [sessionRows] = await pool.query(
            `SELECT is_active FROM evaluation_sessions WHERE batch_id = ? AND phase = ? LIMIT 1`,
            [batch_id !== 'all' ? parsedBatchId : 0, phase] // If batch_id is 'all', this check might not be fully accurate, but we will assume no active session or fetch per batch if needed
        );
        let is_evaluation_active = false;
        if (batch_id !== 'all') {
             is_evaluation_active = sessionRows.length > 0 && sessionRows[0].is_active;
        }

        return res.status(200).json({
            success: true,
            is_evaluation_active: is_evaluation_active,
            data: Object.values(groupsMap)
        });

    } catch (error) {
        console.error('Error in getSupervisorStudentsForMarks:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const upsertMarks = async (req, res) => {
    try {
        const supervisor_id = req.user.id;
        const { 
            student_sap_id, 
            batch_id, 
            proposal_id, 
            fyp_phase = 'FYP-I',
            marks, 
            status 
        } = req.body;

        const parsedBatchId = parseInt(batch_id, 10);
        const parsedProposalId = parseInt(proposal_id, 10);

        if (isNaN(parsedBatchId) || isNaN(parsedProposalId)) {
            return res.status(400).json({ success: false, message: 'Invalid Batch ID or Proposal ID provided' });
        }

        if (!student_sap_id || !batch_id || !proposal_id || !marks) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Module Evaluate: Task 2 Supervisor Block
        const [sessionRows] = await pool.query(
            `SELECT is_active FROM evaluation_sessions WHERE batch_id = ? AND phase = ? LIMIT 1`,
            [parsedBatchId, fyp_phase]
        );
        const isEvaluationActive = sessionRows.length > 0 && sessionRows[0].is_active;

        if (isEvaluationActive) {
            const [committeeRows] = await pool.query(
                `SELECT status FROM committee_evaluations WHERE proposal_id = ? AND fyp_phase = ? LIMIT 1`,
                [parsedProposalId, fyp_phase]
            );
            // If committee has not submitted, marks are pending
            const isPending = committeeRows.length === 0 || committeeRows[0].status !== 'SUBMITTED';
            if (isPending) {
                return res.status(403).json({
                    success: false,
                    message: 'Evaluation in progress by Committee. Entries are temporarily locked.'
                });
            }
        }

        // marks should be an object with lo1_marks to lo8_marks
        const { lo1 = 0, lo2 = 0, lo3 = 0, lo4 = 0, lo5 = 0, lo6 = 0, lo7 = 0, lo8 = 0 } = marks;

        // Sum up total locally for validation
        const total = Number(lo1) + Number(lo2) + Number(lo3) + Number(lo4) + 
                      Number(lo5) + Number(lo6) + Number(lo7) + Number(lo8);

        if (status === 'SUBMITTED' && total !== 100) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot submit final marks unless total is exactly 100. Current total is ${total}.` 
            });
        }

        const query = `
            INSERT INTO supervisor_marks 
                (supervisor_id, student_sap_id, batch_id, proposal_id, fyp_phase, 
                 lo1_marks, lo2_marks, lo3_marks, lo4_marks, lo5_marks, lo6_marks, lo7_marks, lo8_marks, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                lo1_marks = VALUES(lo1_marks),
                lo2_marks = VALUES(lo2_marks),
                lo3_marks = VALUES(lo3_marks),
                lo4_marks = VALUES(lo4_marks),
                lo5_marks = VALUES(lo5_marks),
                lo6_marks = VALUES(lo6_marks),
                lo7_marks = VALUES(lo7_marks),
                lo8_marks = VALUES(lo8_marks),
                status = VALUES(status),
                submitted_at = IF(VALUES(status) = 'SUBMITTED', CURRENT_TIMESTAMP, NULL)
        `;

        const values = [
            supervisor_id, student_sap_id, parsedBatchId, parsedProposalId, fyp_phase,
            lo1, lo2, lo3, lo4, lo5, lo6, lo7, lo8, status
        ];

        await pool.query(query, values);

        return res.status(200).json({ 
            success: true, 
            message: status === 'DRAFT' ? 'Draft saved successfully' : 'Marks submitted successfully' 
        });

    } catch (error) {
        console.error('Error in upsertMarks:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

const getStudentMarksRecord = async (req, res) => {
    try {
        const { batch_id, student_sap_id } = req.params;
        const supervisor_id = req.user.id;
        const phase = req.query.phase || 'FYP-I';

        const parsedBatchId = parseInt(batch_id, 10);

        if (isNaN(parsedBatchId)) {
            return res.status(400).json({ success: false, message: 'Invalid Batch ID provided' });
        }

        const [rows] = await pool.query(`
            SELECT sm.*
            FROM supervisor_marks sm
            JOIN proposals p ON sm.proposal_id = p.id
            WHERE sm.batch_id      = ?
              AND sm.student_sap_id = ?
              AND sm.fyp_phase      = ?
              AND p.supervisor_id   = ?
            LIMIT 1
        `, [parsedBatchId, student_sap_id, phase, supervisor_id]);

        if (rows.length === 0) {
            return res.status(200).json({ success: true, data: null });
        }
        return res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error in getStudentMarksRecord:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ============================================================
// Module 10: Grade Summary (Admin/Coordinator)
// Final % = (Supervisor_Marks / 2) + (Committee_LO_Marks / 2)
// ============================================================
const getGradeSummary = async (req, res) => {
    try {
        const { batchId } = req.params;

        const parsedBatchId = parseInt(batchId, 10);

        if (isNaN(parsedBatchId)) {
            return res.status(400).json({ success: false, message: 'Invalid Batch ID provided' });
        }
        if (!batchId) {
            return res.status(400).json({ success: false, message: 'Batch ID is required' });
        }

        // We join supervisor_marks with users and proposals.
        // Committee marks come from committee_evaluations if they exist.
        const [rows] = await pool.query(`
            SELECT
                p.id                                   AS group_id,
                p.project_title                        AS project_title,
                u.sap_id                               AS student_sap_id,
                u.username                             AS student_name,
                COALESCE(sm.total_marks, 0)            AS supervisor_total,
                ROUND(COALESCE(sm.total_marks, 0) / 2, 2) AS supervisor_grade_50,
                sm.status                              AS supervisor_status,
                COALESCE(ce.committee_avg, 0)          AS committee_avg,
                ROUND(COALESCE(ce.committee_avg, 0) / 2, 2) AS committee_grade_50,
                ROUND(
                    (COALESCE(sm.total_marks, 0) / 2) +
                    (COALESCE(ce.committee_avg, 0) / 2)
                , 2)                                   AS final_percentage
            FROM proposals p
            JOIN proposal_members pm ON p.id = pm.proposal_id
            JOIN users u ON pm.sap_id COLLATE utf8mb4_unicode_ci = u.sap_id COLLATE utf8mb4_unicode_ci
            LEFT JOIN supervisor_marks sm
                ON sm.proposal_id = p.id AND sm.student_sap_id COLLATE utf8mb4_unicode_ci = u.sap_id COLLATE utf8mb4_unicode_ci AND sm.batch_id = p.batch_id
            LEFT JOIN (
                SELECT ce2.proposal_id, AVG(ce2.total_marks) AS committee_avg
                FROM committee_evaluations ce2
                GROUP BY ce2.proposal_id
            ) ce ON ce.proposal_id = p.id
            WHERE p.batch_id = ?
              AND p.status = 'approved'
            ORDER BY p.id, u.username
        `, [parsedBatchId]);

        return res.status(200).json({ success: true, data: rows });
    } catch (error) {
        console.error('Error in getGradeSummary:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    getSupervisorStudentsForMarks,
    upsertMarks,
    getStudentMarksRecord,
    getGradeSummary
};
