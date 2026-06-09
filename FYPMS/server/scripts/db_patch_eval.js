const { pool } = require('./server/config/database');
require('dotenv').config({ path: './server/.env' });

async function patch() {
    try {
        console.log('Starting DB Patch...');
        
        // 1. Add supervisor_sap_id to proposals if missing
        try {
            const [columns] = await pool.query('SHOW COLUMNS FROM proposals LIKE "supervisor_sap_id"');
            if (columns.length === 0) {
                await pool.query('ALTER TABLE proposals ADD COLUMN supervisor_sap_id VARCHAR(20) NULL AFTER supervisor_id');
                console.log('✓ Added supervisor_sap_id to proposals');
            } else {
                console.log('- supervisor_sap_id already exists in proposals');
            }
        } catch(e) {
            console.error('Error adding column:', e.message);
        }

        // 2. Sync supervisor_sap_id from users table
        try {
            const [result] = await pool.query(`
                UPDATE proposals p 
                JOIN users u ON p.supervisor_id = u.id 
                SET p.supervisor_sap_id = u.sap_id 
                WHERE p.supervisor_sap_id IS NULL OR p.supervisor_sap_id = ""
            `);
            console.log(`✓ Synced ${result.changedRows} supervisor SAP IDs`);
        } catch(e) {
            console.error('Error syncing SAP IDs:', e.message);
        }

        // 3. Add Unique Key to supervisor_marks for Individual Evaluation
        try {
            const [indexes] = await pool.query('SHOW INDEX FROM supervisor_marks WHERE Key_name = "uk_student_evaluation"');
            if (indexes.length === 0) {
                await pool.query('ALTER TABLE supervisor_marks ADD UNIQUE KEY uk_student_evaluation (student_sap_id, batch_id, fyp_phase)');
                console.log('✓ Added Unique Key uk_student_evaluation to supervisor_marks');
            } else {
                console.log('- Unique Key uk_student_evaluation already exists');
            }
        } catch(e) {
            console.error('Error adding unique key:', e.message);
        }

        console.log('Database Patched Successfully');
        process.exit(0);
    } catch (err) {
        console.error('Fatal Error:', err);
        process.exit(1);
    }
}

patch();
