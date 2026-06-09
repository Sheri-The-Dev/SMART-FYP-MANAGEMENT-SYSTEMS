const { pool } = require('./config/database');

const run = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS faculty_presentations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                batch_id INT NOT NULL,
                presentation_date DATE NOT NULL,
                presentation_time TIME NOT NULL,
                venue VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (batch_id) REFERENCES academic_batches(id) ON DELETE CASCADE
            )
        `);
        console.log('Tables presentation created');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS presentation_group_assignments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                presentation_id INT NOT NULL,
                proposal_id INT NOT NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (presentation_id) REFERENCES faculty_presentations(id) ON DELETE CASCADE,
                FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
                UNIQUE KEY unique_presentation_proposal (presentation_id, proposal_id)
            )
        `);
        console.log('Tables presentation_group_assignments created');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS faculty_evaluations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                proposal_id INT NOT NULL,
                evaluator_id INT NOT NULL,
                verdict ENUM('APPROVED', 'APPROVED WITH CHANGES', 'REJECTED') NOT NULL,
                scope_adjustments TEXT,
                general_feedback TEXT,
                resubmission_deadline DATETIME NULL,
                evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
                FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('Tables evaluations created');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
