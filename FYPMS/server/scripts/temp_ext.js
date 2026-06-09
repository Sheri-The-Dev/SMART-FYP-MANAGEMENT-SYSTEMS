const { pool } = require('./config/database');
async function run() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS group_deadline_extensions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        proposal_id INT NOT NULL,
        new_deadline DATETIME NOT NULL,
        granted_by INT NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES weekly_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_extension (task_id, proposal_id)
    );`);
    console.log('Successfully configured extensions.');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
