const { pool } = require('../config/database');
const { logAudit } = require('../utils/logger');

// ============================================
// SUBMIT DEFENSE FILES (Student)
// Matches actual defense_submissions schema:
//   proposal_id, presentation_id, proposal_pdf_path,
//   presentation_pptx_path, submission_status
// ============================================
const submitDefense = async (req, res) => {
    const studentId = req.user.id;
    const { proposal_id, presentation_id } = req.body;

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    if (!proposal_id) {
        return res.status(400).json({ success: false, message: 'proposal_id is required.' });
    }

    try {
        const filePath = req.file.path.replace(/\\/g, '/');
        const ext = req.file.originalname.split('.').pop().toLowerCase();

        // Determine if this is PDF or PPTX and update the correct column
        const isPdf = ext === 'pdf';
        const isPptx = ['ppt', 'pptx'].includes(ext);

        if (!isPdf && !isPptx) {
            return res.status(400).json({ success: false, message: 'Only PDF and PPTX files are accepted.' });
        }

        // Upsert: if a submission already exists for this proposal, update it
        const [existing] = await pool.query(
            'SELECT id FROM defense_submissions WHERE proposal_id = ?',
            [proposal_id]
        );

        if (existing.length > 0) {
            const col = isPdf ? 'proposal_pdf_path' : 'presentation_pptx_path';
            await pool.query(
                `UPDATE defense_submissions SET ${col} = ?, submission_status = 'submitted', submitted_at = NOW() WHERE proposal_id = ?`,
                [filePath, proposal_id]
            );
            await logAudit({
                userId: studentId,
                action: 'defense_file_updated',
                details: `Updated ${col} for proposal ${proposal_id}`,
                endpoint: '/api/defense/submit'
            });
            return res.status(200).json({ success: true, message: 'Defense file updated successfully.' });
        } else {
            // New submission — require both paths eventually, but accept partial for now
            const pdfPath  = isPdf  ? filePath : '';
            const pptxPath = isPptx ? filePath : '';

            await pool.query(
                `INSERT INTO defense_submissions
                 (proposal_id, presentation_id, proposal_pdf_path, presentation_pptx_path, submission_status, submitted_at)
                 VALUES (?, ?, ?, ?, 'submitted', NOW())`,
                [proposal_id, presentation_id || null, pdfPath, pptxPath]
            );

            // Update proposals.defense_status
            await pool.query(
                `UPDATE proposals SET defense_status = 'submitted' WHERE id = ?`,
                [proposal_id]
            );

            await logAudit({
                userId: studentId,
                action: 'defense_submitted',
                details: `Defense file submitted for proposal ${proposal_id}`,
                endpoint: '/api/defense/submit'
            });

            return res.status(201).json({ success: true, message: 'Defense file submitted successfully.' });
        }
    } catch (error) {
        console.error('submitDefense Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ============================================
// GET STUDENT'S DEFENSE SCHEDULE
// Returns whether the student's proposal has
// been scheduled for a presentation
// ============================================
const getMyDefenseSchedule = async (req, res) => {
    const studentId = req.user.id;
    try {
        const [rows] = await pool.query(`
            SELECT
                fp.id AS presentation_id,
                fp.presentation_date,
                fp.presentation_time,
                fp.venue,
                pr.id AS proposal_id,
                pr.project_title,
                pr.defense_status,
                ds.submission_status,
                ds.proposal_pdf_path,
                ds.presentation_pptx_path
            FROM proposals pr
            JOIN presentation_group_assignments pga ON pga.proposal_id = pr.id
            JOIN faculty_presentations fp ON fp.id = pga.presentation_id
            LEFT JOIN defense_submissions ds ON ds.proposal_id = pr.id
            WHERE pr.student_id = ?
            ORDER BY fp.presentation_date ASC
            LIMIT 1
        `, [studentId]);

        if (rows.length === 0) {
            return res.status(200).json({ success: true, data: null, message: 'No presentation scheduled yet.' });
        }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('getMyDefenseSchedule Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = { submitDefense, getMyDefenseSchedule };