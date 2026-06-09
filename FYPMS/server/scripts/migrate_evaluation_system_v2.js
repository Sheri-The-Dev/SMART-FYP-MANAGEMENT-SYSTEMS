const { pool } = require('../config/database');

async function migrateEvaluationSystem() {
  const connection = await pool.getConnection();

  try {
    console.log('\n===========================================');
    console.log('  Evaluation System Schema Migration (v2)');
    console.log('===========================================\n');

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // -------------------------------------------------------
    // TABLE 1: evaluation_sessions
    // -------------------------------------------------------
    console.log('[1/4] Ensuring evaluation_sessions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS evaluation_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        session_type ENUM('PROGRESS_PRESENTATION','FINAL_DEMO') NOT NULL,
        eval_date DATE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        min_committee_members INT DEFAULT 2,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES academic_batches(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check for missing columns in evaluation_sessions
    const [evalSessionCols] = await connection.query('SHOW COLUMNS FROM evaluation_sessions');
    const existingCols = evalSessionCols.map(c => c.Field);
    
    if (!existingCols.includes('session_type')) {
      await connection.query("ALTER TABLE evaluation_sessions ADD COLUMN session_type ENUM('PROGRESS_PRESENTATION','FINAL_DEMO') NOT NULL AFTER batch_id");
      console.log('      ✅ session_type column added');
    }
    if (!existingCols.includes('eval_date')) {
      await connection.query("ALTER TABLE evaluation_sessions ADD COLUMN eval_date DATE NOT NULL AFTER session_type");
      console.log('      ✅ eval_date column added');
    }
    if (!existingCols.includes('min_committee_members')) {
      await connection.query("ALTER TABLE evaluation_sessions ADD COLUMN min_committee_members INT DEFAULT 2 AFTER is_active");
      console.log('      ✅ min_committee_members column added');
    }
    if (!existingCols.includes('created_by')) {
      await connection.query("ALTER TABLE evaluation_sessions ADD COLUMN created_by INT NOT NULL AFTER min_committee_members");
      console.log('      ✅ created_by column added');
    }

    // -------------------------------------------------------
    // TABLE 2: session_committee_members
    // -------------------------------------------------------
    console.log('[2/4] Ensuring session_committee_members table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS session_committee_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        committee_member_sap_id VARCHAR(50) NOT NULL,
        time_slot VARCHAR(100),
        assigned_group_ids JSON,
        FOREIGN KEY (session_id) REFERENCES evaluation_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (committee_member_sap_id) REFERENCES users(sap_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('      ✅ session_committee_members table ready');

    // -------------------------------------------------------
    // TABLE 3: committee_evaluations
    // -------------------------------------------------------
    console.log('[3/4] Ensuring committee_evaluations table...');
    
    // Check if table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'committee_evaluations'");
    if (tables.length > 0) {
      // Check columns
      const [commEvalCols] = await connection.query('SHOW COLUMNS FROM committee_evaluations');
      const commCols = commEvalCols.map(c => c.Field);
      
      if (!commCols.includes('session_id')) {
        console.log('      ⚠️  Updating existing committee_evaluations table...');
        // Rename or recreate to match new requirements
        await connection.query("ALTER TABLE committee_evaluations ADD COLUMN session_id INT NOT NULL AFTER id");
        await connection.query("ALTER TABLE committee_evaluations ADD COLUMN committee_member_sap_id VARCHAR(50) NOT NULL AFTER session_id");
        await connection.query("ALTER TABLE committee_evaluations ADD COLUMN student_sap_id VARCHAR(50) NOT NULL AFTER committee_member_sap_id");
        await connection.query("ALTER TABLE committee_evaluations ADD COLUMN is_submitted BOOLEAN DEFAULT FALSE AFTER status");
        await connection.query("ALTER TABLE committee_evaluations CHANGE COLUMN created_at submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        
        // Add unique key
        try {
          await connection.query("ALTER TABLE committee_evaluations ADD UNIQUE KEY unique_eval (session_id, committee_member_sap_id, student_sap_id)");
        } catch(e) {}
        
        // Add check constraint (MySQL 8.0.16+)
        try {
          await connection.query("ALTER TABLE committee_evaluations ADD CONSTRAINT chk_total_marks CHECK (total_marks = 100)");
        } catch(e) {}
      }
    } else {
      await connection.query(`
        CREATE TABLE committee_evaluations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_id INT NOT NULL,
          committee_member_sap_id VARCHAR(50) NOT NULL,
          student_sap_id VARCHAR(50) NOT NULL,
          batch_id INT NOT NULL,
          lo1_marks INT DEFAULT 0,
          lo2_marks INT DEFAULT 0,
          lo3_marks INT DEFAULT 0,
          lo4_marks INT DEFAULT 0,
          lo5_marks INT DEFAULT 0,
          lo6_marks INT DEFAULT 0,
          lo7_marks INT DEFAULT 0,
          lo8_marks INT DEFAULT 0,
          total_marks INT NOT NULL,
          submission_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_submitted BOOLEAN DEFAULT FALSE,
          UNIQUE KEY unique_eval (session_id, committee_member_sap_id, student_sap_id),
          CONSTRAINT chk_total_marks CHECK (total_marks = 100),
          FOREIGN KEY (session_id) REFERENCES evaluation_sessions(id),
          FOREIGN KEY (committee_member_sap_id) REFERENCES users(sap_id),
          FOREIGN KEY (student_sap_id) REFERENCES users(sap_id),
          FOREIGN KEY (batch_id) REFERENCES academic_batches(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    }
    console.log('      ✅ committee_evaluations table ready');

    // -------------------------------------------------------
    // TABLE 4: final_grades
    // -------------------------------------------------------
    console.log('[4/4] Ensuring final_grades table...');
    await connection.query(`
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
        FOREIGN KEY (student_sap_id) REFERENCES users(sap_id),
        FOREIGN KEY (batch_id) REFERENCES academic_batches(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('      ✅ final_grades table ready');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n✅ Evaluation System Migration COMPLETE!');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    process.exit(1);
  } finally {
    connection.release();
  }
}

migrateEvaluationSystem();
