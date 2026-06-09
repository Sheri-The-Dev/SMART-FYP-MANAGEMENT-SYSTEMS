const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../config/database');

async function migrate() {
    try {
        console.log('🚀 Starting Evaluation Session Sub-tables Migration...');

        // 1. session_committee (Normalized linking table)
        await query(`
            CREATE TABLE IF NOT EXISTS session_committee (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                committee_member_sap_id VARCHAR(50) NOT NULL,
                FOREIGN KEY (session_id) REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (committee_member_sap_id) REFERENCES users(sap_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ session_committee table ready.');

        // 2. session_time_slots
        await query(`
            CREATE TABLE IF NOT EXISTS session_time_slots (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id INT NOT NULL,
                group_id INT NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                FOREIGN KEY (session_id) REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES proposals(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ session_time_slots table ready.');

        console.log('✨ Migration complete!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    }
}

migrate();
