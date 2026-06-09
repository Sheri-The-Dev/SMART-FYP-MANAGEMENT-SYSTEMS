require('dotenv').config();
const { pool } = require('../config/database');

const runPhase5Migration = async () => {
  console.log('\n===========================================');
  console.log('  Phase 5 Migration: Supervisor Marks');
  console.log('===========================================\n');

  try {
    // 1. Add marks_deadline to academic_batches
    console.log('[1/2] Updating academic_batches table...');
    try {
      await pool.query(`ALTER TABLE academic_batches ADD COLUMN marks_deadline DATETIME NULL`);
      console.log('      ✅ marks_deadline column added to academic_batches');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('      ⏩ marks_deadline column already exists in academic_batches');
      } else {
        throw e;
      }
    }

    // 2. Create supervisor_marks table
    console.log('[2/2] Creating supervisor_marks table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS supervisor_marks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          supervisor_id INT NOT NULL,
          student_sap_id VARCHAR(50) NOT NULL,
          batch_id INT NOT NULL,
          proposal_id INT NOT NULL,
          fyp_phase ENUM('FYP-I', 'FYP-II') NOT NULL, 
          
          lo1_marks DECIMAL(5,2) NULL,
          lo2_marks DECIMAL(5,2) NULL,
          lo3_marks DECIMAL(5,2) NULL,
          lo4_marks DECIMAL(5,2) NULL,
          lo5_marks DECIMAL(5,2) NULL,
          lo6_marks DECIMAL(5,2) NULL,
          lo7_marks DECIMAL(5,2) NULL,
          lo8_marks DECIMAL(5,2) NULL,
          
          total_marks DECIMAL(5,2) GENERATED ALWAYS AS (
              COALESCE(lo1_marks, 0) + COALESCE(lo2_marks, 0) + COALESCE(lo3_marks, 0) + COALESCE(lo4_marks, 0) + 
              COALESCE(lo5_marks, 0) + COALESCE(lo6_marks, 0) + COALESCE(lo7_marks, 0) + COALESCE(lo8_marks, 0)
          ) STORED,

          status ENUM('DRAFT', 'SUBMITTED') DEFAULT 'DRAFT',
          submitted_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

          -- Prevent duplicate records per student, per supervisor, per phase in a batch
          UNIQUE KEY unique_supervisor_student_eval (supervisor_id, student_sap_id, batch_id, fyp_phase),
          FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (batch_id) REFERENCES academic_batches(id) ON DELETE CASCADE,
          FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
      );
    `);
    console.log('      ✅ supervisor_marks table created');

    console.log('\n🎉 Phase 5 migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runPhase5Migration();
