/**
 * Phase 2 Migration — Defense Submissions & Evaluations
 * 
 * Creates tables for:
 * 1. defense_submissions – stores PDF and PPTX uploads for scheduled groups
 * 2. defense_evaluations – stores teacher evaluations with verdict and tags
 * 3. Adds defense_status column to proposals table
 * 4. Adds defense_submission_id column to proposals (optional)
 * 5. Adds defense_status column to presentation_group_assignments (optional)
 */

const { pool } = require('../config/database');

async function runPhase2Migration() {
    const connection = await pool.getConnection();

    try {
        console.log('\n===========================================');
        console.log('  Phase 2 Migration: Defense Submissions');
        console.log('===========================================\n');

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // -------------------------------------------------------
        // STEP 1: Create defense_submissions table
        // -------------------------------------------------------
        console.log('[1/5] Creating defense_submissions table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS defense_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proposal_id INT NOT NULL,
        presentation_id INT NULL,
        proposal_pdf_path VARCHAR(500) NOT NULL,
        presentation_pptx_path VARCHAR(500) NOT NULL,
        submission_status ENUM('pending', 'submitted', 'evaluated') DEFAULT 'pending',
        submitted_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
        FOREIGN KEY (presentation_id) REFERENCES faculty_presentations(id) ON DELETE SET NULL,
        UNIQUE KEY unique_proposal_submission (proposal_id)
      )
    `);
        console.log('      ✅ defense_submissions table created');

        // -------------------------------------------------------
        // STEP 2: Create defense_evaluations table
        // -------------------------------------------------------
        console.log('[2/5] Creating defense_evaluations table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS defense_evaluations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        submission_id INT NOT NULL,
        evaluator_id INT NOT NULL,
        verdict ENUM('APPROVED', 'APPROVED_WITH_CHANGES', 'REJECTED') NOT NULL,
        feedback_tags JSON,
        written_feedback TEXT,
        evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (submission_id) REFERENCES defense_submissions(id) ON DELETE CASCADE,
        FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
        console.log('      ✅ defense_evaluations table created');

        // -------------------------------------------------------
        // STEP 3: Add defense_status column to proposals
        // -------------------------------------------------------
        console.log('[3/5] Adding defense_status column to proposals...');
        try {
            await connection.query(`
        ALTER TABLE proposals 
        ADD COLUMN defense_status ENUM('not_scheduled', 'scheduled', 'submitted', 'passed', 'failed') DEFAULT 'not_scheduled'
      `);
            console.log('      ✅ defense_status column added to proposals');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('      ✅ defense_status already exists in proposals — skipping');
            } else throw e;
        }

        // -------------------------------------------------------
        // STEP 4: Add defense_submission_id column to proposals (optional)
        // -------------------------------------------------------
        console.log('[4/5] Adding defense_submission_id column to proposals...');
        try {
            await connection.query(`
        ALTER TABLE proposals 
        ADD COLUMN defense_submission_id INT NULL,
        ADD CONSTRAINT fk_proposals_defense_submission 
        FOREIGN KEY (defense_submission_id) REFERENCES defense_submissions(id) ON DELETE SET NULL
      `);
            console.log('      ✅ defense_submission_id column added to proposals');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_DUP_KEYNAME') {
                console.log('      ✅ defense_submission_id already exists — skipping');
            } else throw e;
        }

        // -------------------------------------------------------
        // STEP 5: Add defense_status column to presentation_group_assignments
        // -------------------------------------------------------
        console.log('[5/5] Adding defense_status column to presentation_group_assignments...');
        try {
            await connection.query(`
        ALTER TABLE presentation_group_assignments 
        ADD COLUMN defense_status ENUM('scheduled', 'submitted', 'evaluated', 'rejected') DEFAULT 'scheduled'
      `);
            console.log('      ✅ defense_status column added to presentation_group_assignments');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('      ✅ defense_status already exists in presentation_group_assignments — skipping');
            } else throw e;
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('\n🎉 Phase 2 migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Run if called directly
if (require.main === module) {
    runPhase2Migration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = runPhase2Migration;