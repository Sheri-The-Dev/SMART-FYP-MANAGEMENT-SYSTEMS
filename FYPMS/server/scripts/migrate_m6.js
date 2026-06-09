const { pool } = require('./config/database');

async function up() {
  const connection = await pool.getConnection();
  try {
    console.log('Starting migrations...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Create academic_batches
    await connection.query(`
      CREATE TABLE IF NOT EXISTS academic_batches (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(150) NOT NULL UNIQUE,
          department VARCHAR(100) NOT NULL,
          academic_year VARCHAR(50) NOT NULL,
          fyp_phase ENUM('FYP-I', 'FYP-II') NOT NULL,
          state ENUM('Draft', 'Active', 'Frozen', 'Archived') DEFAULT 'Draft',
          start_date DATE,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('academic_batches created');

    // Alter users table
    // MySQL 8+ supports IF NOT EXISTS for ADD COLUMN but let's do it safely
    try {
        await connection.query('ALTER TABLE users ADD COLUMN batch_id INT NULL');
        await connection.query('ALTER TABLE users ADD FOREIGN KEY (batch_id) REFERENCES academic_batches(id) ON DELETE SET NULL');
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
    
    try {
        await connection.query("ALTER TABLE users ADD COLUMN fyp_phase ENUM('FYP-I', 'FYP-II', 'Not Enrolled') DEFAULT 'Not Enrolled'");
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
    console.log('users table altered');

    // Alter proposals table
    try {
        await connection.query('ALTER TABLE proposals ADD COLUMN batch_id INT NULL');
        await connection.query('ALTER TABLE proposals ADD FOREIGN KEY (batch_id) REFERENCES academic_batches(id) ON DELETE SET NULL');
    } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }
    console.log('proposals table altered');

    // Drop old old Module 6 tables if they exist
    await connection.query('DROP TABLE IF EXISTS task_submissions');
    await connection.query('DROP TABLE IF EXISTS submissions');
    await connection.query('DROP TABLE IF EXISTS milestones');
    
    // The previous prompt said to drop but I should keep `submissions` if it was from Modules 1-5?
    // Wait, the new doc says FR6.4.3 Upload downloadable task templates...
    // Let's NOT drop submissions if it was part of Module 4/5. 
    // Wait, let's keep submissions and just do new tables.

    // Create milestone_tracks
    await connection.query(`
      CREATE TABLE IF NOT EXISTS milestone_tracks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          department VARCHAR(100) NOT NULL,
          fyp_phase ENUM('FYP-I', 'FYP-II') NOT NULL,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('milestone_tracks created');

    // Create weekly_tasks
    await connection.query(`
      CREATE TABLE IF NOT EXISTS weekly_tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          track_id INT NOT NULL,
          week_number INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          task_type ENUM('Template-Based', 'Instruction-Only', 'Attendance') NOT NULL,
          is_mandatory BOOLEAN DEFAULT TRUE,
          release_rule ENUM('Auto', 'Manual') DEFAULT 'Auto',
          deadline_offset_days INT NOT NULL DEFAULT 7,
          has_template BOOLEAN DEFAULT FALSE,
          template_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (track_id) REFERENCES milestone_tracks(id) ON DELETE CASCADE
      )
    `);
    console.log('weekly_tasks created');

    // Create batch_task_overrides
    await connection.query(`
      CREATE TABLE IF NOT EXISTS batch_task_overrides (
          id INT AUTO_INCREMENT PRIMARY KEY,
          batch_id INT NOT NULL,
          new_deadline DATETIME,
          reason TEXT,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (batch_id) REFERENCES academic_batches(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create group_deadline_extensions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS group_deadline_extensions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          task_id INT NOT NULL,
          proposal_id INT NOT NULL,
          new_deadline DATETIME NOT NULL,
          reason TEXT,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES weekly_tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    // Recreate submissions table for weekly tasks
    await connection.query(`
      CREATE TABLE IF NOT EXISTS task_submissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          task_id INT NOT NULL,
          proposal_id INT NOT NULL,
          submitted_by INT NOT NULL,
          file_url VARCHAR(500),
          status ENUM('Pending', 'Evaluated', 'Late', 'Revision Required') DEFAULT 'Pending',
          is_late BOOLEAN DEFAULT FALSE,
          feedback TEXT,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES weekly_tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
          FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    process.exit(1);
  }
}

up();
