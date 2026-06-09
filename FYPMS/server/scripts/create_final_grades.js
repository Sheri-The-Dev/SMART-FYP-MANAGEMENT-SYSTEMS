const { query } = require('../config/database');

async function createTable() {
    try {
        console.log('Creating final_grades table...');
        await query(`
            CREATE TABLE IF NOT EXISTS final_grades (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_sap_id VARCHAR(50) NOT NULL,
                batch_id INT NOT NULL,
                phase ENUM('FYP-I','FYP-II') NOT NULL,
                committee_average DECIMAL(5,2),
                supervisor_marks DECIMAL(5,2),
                final_percentage DECIMAL(5,2),
                letter_grade VARCHAR(3),
                is_released BOOLEAN DEFAULT FALSE,
                is_locked BOOLEAN DEFAULT FALSE,
                calculation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_student_batch (student_sap_id, batch_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('Table final_grades created or already exists.');
        process.exit(0);
    } catch (e) {
        console.error('Error creating table:', e);
        process.exit(1);
    }
}

createTable();
