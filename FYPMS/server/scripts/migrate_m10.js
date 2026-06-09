const { pool } = require('./config/database');

async function migrate_m10() {
  console.log('Starting M10 Migration...');
  try {
    const connection = await pool.getConnection();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS evaluation_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        phase VARCHAR(50) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Created evaluation_sessions table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS committee_evaluations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proposal_id INT NOT NULL,
        evaluator_id INT NOT NULL,
        batch_id INT NOT NULL,
        fyp_phase VARCHAR(50) NOT NULL,
        lo1_marks DECIMAL(5,2) DEFAULT 0,
        lo2_marks DECIMAL(5,2) DEFAULT 0,
        lo3_marks DECIMAL(5,2) DEFAULT 0,
        lo4_marks DECIMAL(5,2) DEFAULT 0,
        lo5_marks DECIMAL(5,2) DEFAULT 0,
        lo6_marks DECIMAL(5,2) DEFAULT 0,
        lo7_marks DECIMAL(5,2) DEFAULT 0,
        lo8_marks DECIMAL(5,2) DEFAULT 0,
        total_marks DECIMAL(5,2) DEFAULT 0,
        status ENUM('DRAFT', 'SUBMITTED') DEFAULT 'DRAFT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Created committee_evaluations table');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS final_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_sap_id VARCHAR(50) NOT NULL,
        batch_id INT NOT NULL,
        supervisor_score_50 DECIMAL(5,2) DEFAULT 0,
        committee_score_50 DECIMAL(5,2) DEFAULT 0,
        final_percentage DECIMAL(5,2) DEFAULT 0,
        letter_grade VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Created final_results table');

    // Add results_released to academic_batches if it doesn't exist
    try {
      await connection.query(`
        ALTER TABLE academic_batches ADD COLUMN results_released BOOLEAN DEFAULT FALSE;
      `);
      console.log('Added results_released to academic_batches');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('results_released already exists in academic_batches');
      } else {
        throw err;
      }
    }

    connection.release();
    console.log('M10 Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate_m10();
