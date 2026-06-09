const { pool } = require('../config/database');

async function runPhase3Migration() {
    const connection = await pool.getConnection();

    try {
        console.log('\n===========================================');
        console.log('  Phase 3 Migration: Task Evaluations');
        console.log('===========================================\n');

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // -------------------------------------------------------
        // STEP 1: Add file_size and file_mime to task_submissions
        // -------------------------------------------------------
        console.log('[1/2] Updating task_submissions table...');
        try {
            await connection.query(`
                ALTER TABLE task_submissions
                ADD COLUMN file_size BIGINT NULL,
                ADD COLUMN file_mime VARCHAR(100) NULL
            `);
            console.log('      ✅ file_size and file_mime columns added to task_submissions');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('      ✅ file_size and file_mime already exist in task_submissions — skipping');
            } else throw e;
        }

        // -------------------------------------------------------
        // STEP 2: Create task_evaluations table
        // -------------------------------------------------------
        console.log('[2/2] Creating task_evaluations table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS task_evaluations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                submission_id INT NOT NULL,
                evaluator_id INT NOT NULL,
                marks TINYINT UNSIGNED NOT NULL,
                feedback TEXT,
                evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT chk_marks CHECK (marks BETWEEN 0 AND 10),
                UNIQUE KEY unique_submission_evaluator (submission_id, evaluator_id),
                FOREIGN KEY (submission_id) REFERENCES task_submissions(id) ON DELETE CASCADE,
                FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('      ✅ task_evaluations table created');

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('\n🎉 Phase 3 migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        connection.release();
    }
}

// Run if called directly
if (require.main === module) {
    runPhase3Migration()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = runPhase3Migration;
