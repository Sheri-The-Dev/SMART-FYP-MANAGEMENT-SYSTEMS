const { pool } = require('../config/database');
require('dotenv').config();

const migrate = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🚀 Starting Committee Evaluation Sessions migration...');

    await connection.beginTransaction();

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // TABLE 1: evaluation_sessions
    console.log('[1/3] Creating evaluation_sessions table...');
    // Drop if exists to ensure schema match as per requested pattern
    await connection.query('DROP TABLE IF EXISTS evaluation_session_assignments');
    await connection.query('DROP TABLE IF EXISTS evaluation_session_committee');
    await connection.query('DROP TABLE IF EXISTS evaluation_sessions');

    await connection.query(`
      CREATE TABLE evaluation_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        batch_id INT,
        session_type ENUM('PROGRESS_PRESENTATION', 'FINAL_DEMO') DEFAULT 'PROGRESS_PRESENTATION',
        session_date DATE,
        session_time TIME,
        venue VARCHAR(255),
        academic_year VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES academic_batches(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('      ✅ evaluation_sessions table created');

    // TABLE 2: evaluation_session_assignments
    console.log('[2/3] Creating evaluation_session_assignments table...');
    await connection.query(`
      CREATE TABLE evaluation_session_assignments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id INT,
        group_id INT,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        evaluation_status ENUM('PENDING','IN_PROGRESS','COMPLETE') DEFAULT 'PENDING',
        FOREIGN KEY (session_id) REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (group_id) REFERENCES proposals(id) ON DELETE CASCADE
      )
    `);
    console.log('      ✅ evaluation_session_assignments table created');

    // TABLE 3: evaluation_session_committee
    console.log('[3/3] Creating evaluation_session_committee table...');
    await connection.query(`
      CREATE TABLE evaluation_session_committee (
        id INT PRIMARY KEY AUTO_INCREMENT,
        session_id INT,
        committee_member_id INT,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (committee_member_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('      ✅ evaluation_session_committee table created');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Migration failed:', error);
  } finally {
    connection.release();
    process.exit();
  }
};

migrate();
