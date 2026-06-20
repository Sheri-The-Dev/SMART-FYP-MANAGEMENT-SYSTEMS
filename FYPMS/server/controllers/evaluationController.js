const { pool } = require('../config/database');
const { sendCommitteeAssignmentEmail, sendStudentTimeSlotEmail } = require('../utils/emailService');

// FUNCTION 0 — createSession(req, res)
// Route: POST /api/coordinator/create-session
const createSession = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { batch_id: batchIdParam, session_type, evaluation_date, assigned_committee, group_slots } = req.body;
        const coordinator_id = req.user.id;

        const batch_id = parseInt(batchIdParam, 10);
        if (isNaN(batch_id)) {
            if (connection) await connection.rollback();
            return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
        }

        // 1. Validation
        if (!batchIdParam || !session_type || !evaluation_date || !assigned_committee || !group_slots) {
            if (connection) await connection.rollback();
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        if (!Array.isArray(assigned_committee) || assigned_committee.length < 2) {
            if (connection) await connection.rollback();
            return res.status(400).json({ success: false, message: 'At least 2 committee members are required' });
        }

        await connection.beginTransaction();

        // 2. Insert into evaluation_sessions
        const [sessionResult] = await connection.query(`
            INSERT INTO evaluation_sessions (batch_id, session_type, eval_date, created_by)
            VALUES (?, ?, ?, ?)
        `, [batch_id, session_type, evaluation_date, coordinator_id]);

        const session_id = sessionResult.insertId;

        // 3. Bulk insert committee mappings into session_committee
        const committeeValues = assigned_committee.map(sap_id => [session_id, sap_id]);
        await connection.query(`
            INSERT INTO session_committee (session_id, committee_member_sap_id)
            VALUES ?
        `, [committeeValues]);

        // 4. Bulk insert time slots into session_time_slots
        const slotValues = group_slots.map(slot => {
            const groupId = parseInt(slot.group_id, 10);
            if (isNaN(groupId)) {
                throw new Error(`Invalid Group ID provided: ${slot.group_id}`);
            }
            return [session_id, groupId, slot.start_time, slot.end_time];
        });
        await connection.query(`
            INSERT INTO session_time_slots (session_id, group_id, start_time, end_time)
            VALUES ?
        `, [slotValues]);

        await connection.commit();

        // 5. Post-Transaction: Async Notifications
        // a) Email Committee Members
        const committeeEmailsPromise = (async () => {
            const [members] = await pool.query(`SELECT username, email FROM users WHERE sap_id IN (?)`, [assigned_committee]);
            for (const member of members) {
                await sendCommitteeAssignmentEmail(member.email, member.username, evaluation_date);
            }
        })();

        // b) Email Students
        const studentEmailsPromise = (async () => {
            for (const slot of group_slots) {
                const [students] = await pool.query(`
                    SELECT u.username, u.email, p.project_title
                    FROM users u
                    JOIN proposal_members pm ON u.sap_id = pm.sap_id
                    JOIN proposals p ON pm.proposal_id = p.id
                    WHERE p.id = ? AND pm.status = 'accepted'
                `, [parseInt(slot.group_id, 10)]);

                for (const student of students) {
                    await sendStudentTimeSlotEmail(
                        student.email, 
                        student.username, 
                        student.project_title, 
                        evaluation_date, 
                        slot.start_time, 
                        slot.end_time
                    );
                }
            }
        })();

        // We don't wait for emails to finish before responding to the client
        // but we start the process.
        Promise.all([committeeEmailsPromise, studentEmailsPromise]).catch(err => {
            console.error('Async Email Notification Error:', err);
        });

        return res.status(201).json({ 
            success: true, 
            message: 'Evaluation session created and notifications queued',
            session_id 
        });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('createSession Error:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// FUNCTION 1 — getMyAssignedGroups(req, res)
// Route: GET /api/evaluation/committee/my-groups
const getMyAssignedGroups = async (req, res) => {
    try {
        const committee_sap_id = req.user.sap_id;

        // 1. Get all active sessions where this member is assigned
        const [sessions] = await pool.query(`
            SELECT 
                sc.session_id,
                es.session_type,
                es.eval_date,
                es.batch_id,
                b.name AS batch_name
            FROM session_committee sc
            JOIN evaluation_sessions es ON sc.session_id = es.id
            JOIN academic_batches b ON es.batch_id = b.id
            WHERE sc.committee_member_sap_id = ? AND es.is_active = true
        `, [committee_sap_id]);

        if (sessions.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const result = [];

        for (const session of sessions) {
            // 2. Get all groups assigned to this session (from session_time_slots)
            const [groups] = await pool.query(`
                SELECT 
                    sts.group_id,
                    sts.start_time,
                    sts.end_time,
                    p.project_title,
                    u.sap_id AS student_sap_id,
                    u.username AS student_name
                FROM session_time_slots sts
                JOIN proposals p ON sts.group_id = p.id
                JOIN proposal_members pm ON p.id = pm.proposal_id
                JOIN users u ON pm.sap_id = u.sap_id
                WHERE sts.session_id = ? AND pm.status = 'accepted'
            `, [session.session_id]);

            const groupsMap = {};
            for (const row of groups) {
                if (!groupsMap[row.group_id]) {
                    groupsMap[row.group_id] = {
                        group_id: row.group_id,
                        project_title: row.project_title,
                        batch_id: session.batch_id,
                        batch_name: session.batch_name,
                        session_id: session.session_id,
                        session_type: session.session_type,
                        eval_date: session.eval_date,
                        start_time: row.start_time,
                        end_time: row.end_time,
                        students: []
                    };
                }

                // Check if already evaluated by this member in this session
                const [evalCheck] = await pool.query(`
                    SELECT * FROM committee_evaluations 
                    WHERE session_id = ? AND committee_member_sap_id = ? AND student_sap_id = ?
                    LIMIT 1
                `, [session.session_id, committee_sap_id, row.student_sap_id]);

                groupsMap[row.group_id].students.push({
                    sap_id: row.student_sap_id,
                    name: row.student_name,
                    already_evaluated: evalCheck.length > 0,
                    marks: evalCheck.length > 0 ? {
                        lo1_marks: evalCheck[0].lo1_marks,
                        lo2_marks: evalCheck[0].lo2_marks,
                        lo3_marks: evalCheck[0].lo3_marks,
                        lo4_marks: evalCheck[0].lo4_marks,
                        lo5_marks: evalCheck[0].lo5_marks,
                        lo6_marks: evalCheck[0].lo6_marks,
                        lo7_marks: evalCheck[0].lo7_marks,
                        lo8_marks: evalCheck[0].lo8_marks,
                    } : null
                });
            }

            result.push(...Object.values(groupsMap));
        }

        return res.status(200).json({ success: true, data: result });

    } catch (err) {
        console.error('getMyAssignedGroups Error:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    }
};

// FUNCTION 2 — submitCommitteeMarks(req, res)
// Route: POST /api/evaluation/committee/submit
const submitCommitteeMarks = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { session_id: sessionIdParam, student_sap_id, lo1_marks, lo2_marks, lo3_marks, lo4_marks, lo5_marks, lo6_marks, lo7_marks, lo8_marks } = req.body;
        const committee_sap_id = req.user.sap_id;

        const session_id = parseInt(sessionIdParam, 10);
        if (isNaN(session_id)) {
            if (connection) await connection.rollback();
            return res.status(400).json({ success: false, message: 'Invalid Session ID provided.' });
        }

        if (!sessionIdParam || !student_sap_id) {
            if (connection) await connection.rollback();
            return res.status(400).json({ success: false, message: 'Missing session_id or student_sap_id' });
        }

        // a) Check evaluation_sessions.is_active
        const [session] = await connection.query(`SELECT is_active, batch_id FROM evaluation_sessions WHERE id = ?`, [session_id]);
        if (session.length === 0 || !session[0].is_active) {
            if (connection) await connection.rollback();
            return res.status(403).json({ success: false, message: 'Session closed' });
        }
        const batch_id = session[0].batch_id;

        // b) Check UNIQUE constraint (Already submitted)
        const [existing] = await connection.query(`
            SELECT 1 FROM committee_evaluations 
            WHERE session_id = ? AND committee_member_sap_id = ? AND student_sap_id = ?
        `, [session_id, committee_sap_id, student_sap_id]);
        if (existing.length > 0) {
            if (connection) await connection.rollback();
            return res.status(409).json({ success: false, message: 'Already evaluated' });
        }

        // c) Validate total marks === 100
        const total = Number(lo1_marks || 0) + Number(lo2_marks || 0) + Number(lo3_marks || 0) + Number(lo4_marks || 0) +
                      Number(lo5_marks || 0) + Number(lo6_marks || 0) + Number(lo7_marks || 0) + Number(lo8_marks || 0);
        
        if (total !== 100) {
            if (connection) await connection.rollback();
            return res.status(400).json({ success: false, message: 'Total must equal 100' });
        }

        await connection.beginTransaction();

        // d) Marks are IMMUTABLE after submission (INSERT only)
        await connection.query(`
            INSERT INTO committee_evaluations (
                session_id, committee_member_sap_id, student_sap_id, batch_id,
                lo1_marks, lo2_marks, lo3_marks, lo4_marks, lo5_marks, lo6_marks, lo7_marks, lo8_marks,
                total_marks, is_submitted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)
        `, [
            session_id, committee_sap_id, student_sap_id, batch_id,
            lo1_marks, lo2_marks, lo3_marks, lo4_marks, lo5_marks, lo6_marks, lo7_marks, lo8_marks,
            total
        ]);

        // e) Check if ALL assigned committee members have submitted for this student
        const [studentInfo] = await connection.query(`
            SELECT proposal_id FROM proposal_members WHERE sap_id = ? AND status = 'accepted' LIMIT 1
        `, [student_sap_id]);
        
        if (studentInfo.length > 0) {
            const proposal_id = studentInfo[0].proposal_id;

            const [assignedMembers] = await connection.query(`
                SELECT committee_member_sap_id 
                FROM session_committee_members 
                WHERE session_id = ? AND JSON_CONTAINS(assigned_group_ids, ?)
            `, [session_id, String(proposal_id)]);

            const [submittedMembers] = await connection.query(`
                SELECT committee_member_sap_id 
                FROM committee_evaluations 
                WHERE session_id = ? AND student_sap_id = ?
            `, [session_id, student_sap_id]);

            if (submittedMembers.length >= assignedMembers.length && assignedMembers.length > 0) {
                await calculateFinalGradeInternal(student_sap_id, batch_id, connection);
            }
        }

        await connection.commit();
        return res.status(200).json({ success: true, message: 'Marks submitted successfully' });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('submitCommitteeMarks Error:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    } finally {
        if (connection) connection.release();
    }
};

// FUNCTION 3 — calculateFinalGrade(student_sap_id, batch_id) [internal]
const calculateFinalGradeInternal = async (student_sap_id, batch_id, connection) => {
    try {
        const [evals] = await connection.query(`
            SELECT total_marks FROM committee_evaluations 
            WHERE student_sap_id = ? AND batch_id = ?
        `, [student_sap_id, batch_id]);

        if (evals.length === 0) return;

        const totalMarksSum = evals.reduce((sum, row) => sum + Number(row.total_marks), 0);
        const committee_average = totalMarksSum / evals.length;

        const [supMarks] = await connection.query(`
            SELECT total_marks FROM supervisor_marks 
            WHERE student_sap_id = ? AND batch_id = ? AND status = 'SUBMITTED'
            LIMIT 1
        `, [student_sap_id, batch_id]);

        const supervisor_marks = supMarks.length > 0 ? Number(supMarks[0].total_marks) : 0;

        const final_percentage = Number(((committee_average / 2) + (supervisor_marks / 2)).toFixed(2));

        let letter_grade = 'F';
        if (final_percentage >= 90) letter_grade = 'A+';
        else if (final_percentage >= 85) letter_grade = 'A';
        else if (final_percentage >= 80) letter_grade = 'A-';
        else if (final_percentage >= 75) letter_grade = 'B+';
        else if (final_percentage >= 71) letter_grade = 'B';
        else if (final_percentage >= 68) letter_grade = 'B-';
        else if (final_percentage >= 64) letter_grade = 'C+';
        else if (final_percentage >= 61) letter_grade = 'C';
        else if (final_percentage >= 58) letter_grade = 'C-';
        else if (final_percentage >= 54) letter_grade = 'D+';
        else if (final_percentage >= 50) letter_grade = 'D';

        const [sessionInfo] = await connection.query(`
            SELECT session_type FROM evaluation_sessions WHERE batch_id = ? ORDER BY created_at DESC LIMIT 1
        `, [batch_id]);
        const phase = sessionInfo.length > 0 && sessionInfo[0].session_type === 'FINAL_DEMO' ? 'FYP-II' : 'FYP-I';

        await connection.query(`
            INSERT INTO final_grades (
                student_sap_id, batch_id, phase, committee_average, supervisor_marks, 
                final_percentage, letter_grade, is_released, is_locked
            ) VALUES (?, ?, ?, ?, ?, ?, ?, false, false)
            ON DUPLICATE KEY UPDATE
                committee_average = VALUES(committee_average),
                supervisor_marks = VALUES(supervisor_marks),
                final_percentage = VALUES(final_percentage),
                letter_grade = VALUES(letter_grade),
                calculation_timestamp = CURRENT_TIMESTAMP
        `, [student_sap_id, batch_id, phase, committee_average, supervisor_marks, final_percentage, letter_grade]);

    } catch (err) {
        console.error('calculateFinalGradeInternal Error:', err);
        throw err;
    }
};

// FUNCTION 4 — getGradeSummary(req, res)
// Route: GET /api/evaluation/grades/summary?batch_id=X
const getGradeSummary = async (req, res) => {
    try {
        const { batch_id: batchIdParam } = req.query;
        const batch_id = parseInt(batchIdParam, 10);

        if (isNaN(batch_id)) {
            return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
        }

        if (!batchIdParam) {
            return res.status(400).json({ success: false, message: 'batch_id is required' });
        }

        const [rows] = await pool.query(`
            SELECT 
                p.id AS group_id,
                u.username AS student_name,
                u.sap_id AS student_sap_id,
                COALESCE(sm.total_marks, 0) AS supervisor_marks,
                COALESCE(fg.committee_average, 0) AS committee_average,
                COALESCE(fg.final_percentage, 0) AS final_percentage,
                COALESCE(fg.letter_grade, 'N/A') AS letter_grade,
                CASE 
                    WHEN fg.id IS NOT NULL THEN 'COMPLETE'
                    ELSE 'PENDING'
                END AS committee_status
            FROM proposals p
            JOIN proposal_members pm ON p.id = pm.proposal_id
            JOIN users u ON pm.sap_id = u.sap_id
            LEFT JOIN supervisor_marks sm ON u.sap_id = sm.student_sap_id AND p.batch_id = sm.batch_id AND sm.status = 'SUBMITTED'
            LEFT JOIN final_grades fg ON u.sap_id = fg.student_sap_id AND p.batch_id = fg.batch_id
            WHERE p.batch_id = ? AND pm.status = 'accepted'
            ORDER BY p.id, u.sap_id
        `, [batch_id]);

        return res.status(200).json({ success: true, data: rows });

    } catch (err) {
        console.error('getGradeSummary Error:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    }
};

// FUNCTION 5 — releaseResults(req, res)
// Route: POST /api/evaluation/grades/release
const releaseResults = async (req, res) => {
    try {
        const { batch_id: batchIdParam } = req.body;
        const batch_id = parseInt(batchIdParam, 10);

        if (isNaN(batch_id)) {
            return res.status(400).json({ success: false, message: 'Invalid Batch ID provided.' });
        }

        if (!batchIdParam) {
            return res.status(400).json({ success: false, message: 'batch_id is required' });
        }

        await pool.query(`
            UPDATE final_grades SET is_released = true 
            WHERE batch_id = ? AND is_locked = false
        `, [batch_id]);

        await pool.query(`
            UPDATE final_grades SET is_locked = true 
            WHERE batch_id = ?
        `, [batch_id]);

        return res.status(200).json({ success: true, message: 'Results released and locked successfully' });

    } catch (err) {
        console.error('releaseResults Error:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    }
};

// FUNCTION 6 — getMyGrade(req, res)
// Route: GET /api/evaluation/grades/my-result
const getMyGrade = async (req, res) => {
    try {
        const student_sap_id = req.user.sap_id;

        const [rows] = await pool.query(`
            SELECT final_percentage, letter_grade, committee_average, supervisor_marks, is_released
            FROM final_grades
            WHERE student_sap_id = ?
            ORDER BY calculation_timestamp DESC
            LIMIT 1
        `, [student_sap_id]);

        if (rows.length === 0 || !rows[0].is_released) {
            return res.status(200).json({ success: true, data: { status: 'Results Pending' } });
        }

        return res.status(200).json({ success: true, data: rows[0] });

    } catch (err) {
        console.error('getMyGrade Error:', err);
        return res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
    }
};

module.exports = {
    createSession,
    getMyAssignedGroups,
    submitCommitteeMarks,
    getGradeSummary,
    releaseResults,
    getMyGrade
};
