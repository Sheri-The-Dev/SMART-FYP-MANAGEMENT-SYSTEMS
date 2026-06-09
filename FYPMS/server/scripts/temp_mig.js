const { pool } = require('./config/database');

async function run() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS transition_issue_flags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        group_id INT NOT NULL,
        flagged_by INT NOT NULL,
        reason TEXT NOT NULL,
        is_resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        FOREIGN KEY (batch_id) REFERENCES academic_batches(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES proposals(id) ON DELETE CASCADE,
        FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE CASCADE
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS transition_audits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_batch_id INT NOT NULL,
        target_batch_id INT NOT NULL,
        transitioned_by INT NOT NULL,
        total_students_transitioned INT DEFAULT 0,
        groups_transitioned INT DEFAULT 0,
        override_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_batch_id) REFERENCES academic_batches(id) ON DELETE CASCADE,
        FOREIGN KEY (target_batch_id) REFERENCES academic_batches(id) ON DELETE CASCADE,
        FOREIGN KEY (transitioned_by) REFERENCES users(id) ON DELETE CASCADE
    );`);

    console.log('Successfully created transition schemas.');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
