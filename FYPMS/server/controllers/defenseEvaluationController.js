const { pool } = require('../config/database');
const { logAudit } = require('../utils/logger');
const { sendEmail } = require('../utils/emailService');

// ============================================
// STEP 3: GET SCHEDULED DEFENSES (Teacher View)
// Returns one card per GROUP (proposal) that is
// scheduled for today or upcoming, with file info
// ============================================
const getScheduledDefenses = async (req, res) => {
    try {
        // Fetch each group assignment for presentations scheduled today/future
        const [rows] = await pool.query(`
            SELECT
                pga.id            AS assignment_id,
                fp.id             AS presentation_id,
                fp.presentation_date,
                fp.presentation_time,
                fp.venue,
                b.name            AS batch_name,
                pr.id             AS proposal_id,
                pr.project_title  AS project,
                pr.defense_status,
                u.username        AS lead_name,
                u.email           AS lead_email,
                ds.id             AS submission_id,
                ds.proposal_pdf_path,
                ds.presentation_pptx_path,
                ds.submission_status,
                pga.defense_status AS group_defense_status
            FROM presentation_group_assignments pga
            JOIN faculty_presentations fp ON fp.id = pga.presentation_id
            JOIN academic_batches b       ON b.id  = fp.batch_id
            JOIN proposals pr             ON pr.id = pga.proposal_id
            JOIN users u                  ON u.id  = pr.student_id
            LEFT JOIN defense_submissions ds ON ds.proposal_id = pr.id
            WHERE DATE(fp.presentation_date) >= CURDATE()
              AND (pga.defense_status IS NULL OR pga.defense_status != 'evaluated')
            ORDER BY fp.presentation_date ASC, fp.presentation_time ASC
        `);

        // Build list — one item per group (proposal)
        const result = rows.map(r => {
            const dateStr = r.presentation_date
                ? new Date(r.presentation_date).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                })
                : '—';

            return {
                id: r.assignment_id,       // unique ID for this evaluation card
                presentationId: r.presentation_id,
                proposalId: r.proposal_id,
                project: r.project || '—',
                groupName: r.batch_name,
                leadName: r.lead_name,
                leadEmail: r.lead_email,
                members: [r.lead_name],         // lead student; expand below if needed
                scheduledTime: `${dateStr} at ${r.presentation_time || '—'}`,
                venue: r.venue,
                defenseStatus: r.defense_status,
                submissionStatus: r.submission_status || 'not_submitted',
                // File URLs (proxied via /uploads)
                proposalUrl: r.proposal_pdf_path
                    ? `/${r.proposal_pdf_path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/')}`
                    : null,
                presentationUrl: r.presentation_pptx_path
                    ? `/${r.presentation_pptx_path.replace(/\\/g, '/').replace(/^.*uploads\//, 'uploads/')}`
                    : null,
            };
        });

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('getScheduledDefenses Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


// ============================================
// STEP 4: SUBMIT EVALUATION (Teacher)
// Implements Smart Routing + Rejection Loop
// ============================================
const submitEvaluation = async (req, res) => {
    const { defenseId, proposalId, presentationId, verdict, feedback, tags } = req.body;
    const evaluatorId = req.user.id;

    if (!defenseId || !verdict) {
        return res.status(400).json({
            success: false,
            message: 'defenseId (assignment_id) and verdict are required.'
        });
    }

    // Map frontend strings -> DB ENUM
    const verdictMap = {
        approved: 'APPROVED',
        approved_with_changes: 'APPROVED_WITH_CHANGES',
        rejected: 'REJECTED',
        APPROVED: 'APPROVED',
        APPROVED_WITH_CHANGES: 'APPROVED_WITH_CHANGES',
        REJECTED: 'REJECTED',
    };
    const dbVerdict = verdictMap[verdict] || 'APPROVED';

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Save evaluation record (find/create submission_id)
        const [subs] = await connection.query(
            'SELECT id FROM defense_submissions WHERE proposal_id = ? LIMIT 1',
            [proposalId]
        );

        let submissionId = subs.length > 0 ? subs[0].id : null;

        if (submissionId) {
            // Save formal evaluation
            await connection.query(
                `INSERT INTO defense_evaluations
                 (submission_id, evaluator_id, verdict, feedback_tags, written_feedback)
                 VALUES (?, ?, ?, ?, ?)`,
                [submissionId, evaluatorId, dbVerdict, JSON.stringify(tags || []), feedback || '']
            );
            await connection.query(
                'UPDATE defense_submissions SET submission_status = ? WHERE id = ?',
                ['evaluated', submissionId]
            );
        }

        // ─────────────────────────────────────────────────
        // LOGIC GATE A — APPROVED or APPROVED WITH CHANGES
        // ─────────────────────────────────────────────────
        if (dbVerdict === 'APPROVED' || dbVerdict === 'APPROVED_WITH_CHANGES') {
            // Mark proposals as passed
            await connection.query(
                'UPDATE proposals SET defense_status = ? WHERE id = ?',
                ['passed', proposalId]
            );

            // Mark assignment as evaluated (stays in table but won't re-show)
            await connection.query(
                'UPDATE presentation_group_assignments SET defense_status = ? WHERE id = ?',
                ['evaluated', defenseId]
            );

            await logAudit({
                userId: evaluatorId,
                action: 'defense_approved',
                details: `Proposal ${proposalId} defense approved: ${dbVerdict}`,
                endpoint: '/api/defense/evaluate'
            });

            // Send approval email to lead student
            try {
                const [students] = await connection.query(
                    'SELECT u.email, u.username FROM proposals pr JOIN users u ON u.id = pr.student_id WHERE pr.id = ?',
                    [proposalId]
                );
                if (students.length > 0) {
                    const tagStr = tags && tags.length > 0 ? `\n\nFeedback Tags: ${tags.join(', ')}` : '';
                    const feedbackStr = feedback ? `\n\nComments: ${feedback}` : '';
                    await sendEmail({
                        to: students[0].email,
                        subject: '🎉 Defense Approved — FYPMS',
                        text: `Dear ${students[0].username},\n\nCongratulations! Your proposal defense has been ${dbVerdict === 'APPROVED' ? 'APPROVED' : 'APPROVED WITH CHANGES'}.\n\nYou may now proceed with your FYP work.${tagStr}${feedbackStr}\n\nBest regards,\nFYPMS Team`
                    });
                }
            } catch (emailErr) {
                console.error('Approval email failed (non-critical):', emailErr.message);
            }

            // LOGIC GATE B — REJECTED (The Rejection Loop)
            // ─────────────────────────────────────────────────
        } else {
            // 1. Reset proposal defense status → back to not_scheduled (allowed to be re-scheduled)
            await connection.query(
                'UPDATE proposals SET defense_status = ?, status = ? WHERE id = ?',
                ['not_scheduled', 'approved', proposalId]
            );

            // 2. Remove from current presentation group assignments
            // → Group reappears as "unscheduled" in Admin's scheduler pool
            await connection.query(
                'DELETE FROM presentation_group_assignments WHERE id = ?',
                [defenseId]
            );

            // 3. Reset the defense submission status so student can re-upload if needed
            if (submissionId) {
                await connection.query(
                    'UPDATE defense_submissions SET submission_status = ? WHERE id = ?',
                    ['pending', submissionId]
                );
            }

            await logAudit({
                userId: evaluatorId,
                action: 'defense_rejected',
                details: `Proposal ${proposalId} defense REJECTED. Group reset to unscheduled pool for re-defense.`,
                endpoint: '/api/defense/evaluate'
            });

            // Send rejection email with feedback
            try {
                const [students] = await connection.query(
                    'SELECT u.email, u.username FROM proposals pr JOIN users u ON u.id = pr.student_id WHERE pr.id = ?',
                    [proposalId]
                );
                if (students.length > 0) {
                    const tagStr = tags && tags.length > 0 ? `\nFeedback Tags: ${tags.join(', ')}` : '';
                    const feedbackStr = feedback ? `\n\nDetailed Feedback:\n${feedback}` : '';
                    await sendEmail({
                        to: students[0].email,
                        subject: '⚠️ Defense Rejected — Re-Defense Required — FYPMS',
                        text: `Dear ${students[0].username},\n\nWe regret to inform you that your proposal defense was REJECTED.\n\nYour group has been reset to the unscheduled queue. The coordinator will assign you a new defense date.${tagStr}${feedbackStr}\n\nPlease address the feedback and prepare for your re-defense.\n\nBest regards,\nFYPMS Team`
                    });
                }
            } catch (emailErr) {
                console.error('Rejection email failed (non-critical):', emailErr.message);
            }
        }

        await connection.commit();
        res.status(200).json({
            success: true,
            message: `Evaluation submitted. Verdict: ${dbVerdict}`
        });

    } catch (error) {
        await connection.rollback();
        console.error('submitEvaluation Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    } finally {
        connection.release();
    }
};

module.exports = { submitEvaluation, getScheduledDefenses };