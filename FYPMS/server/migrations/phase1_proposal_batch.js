/**
 * Phase 1 Migration — Proposal-Batch Integration
 * 
 * Kya karta hai ye script:
 * 1. proposals table mein batch_id ensure karta hai (already in migrate_m6 but run safely)
 * 2. group_deadline_extensions mein 'granted_by' column add karta hai (old column name was created_by)
 * 3. academic_batches mein track_id ensure karta hai
 * 4. Ek 'my-batch' API ke liye koi schema change nahi chahiye
 * 
 * Safe to run multiple times — idempotent script hai.
 */

const { pool } = require('../config/database');

async function runPhase1Migration() {
  const connection = await pool.getConnection();

  try {
    console.log('\n===========================================');
    console.log('  Phase 1 Migration: Proposal-Batch Link');
    console.log('===========================================\n');

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // -------------------------------------------------------
    // STEP 1: proposals table mein batch_id ensure karo
    // -------------------------------------------------------
    console.log('[1/6] Checking proposals.batch_id ...');
    try {
      await connection.query(`
        ALTER TABLE proposals ADD COLUMN batch_id INT NULL
      `);
      console.log('      ✅ batch_id column added to proposals');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('      ✅ batch_id already exists in proposals — skipping');
      } else throw e;
    }

    // Add foreign key for proposals.batch_id (safe — ignore if already exists)
    try {
      await connection.query(`
        ALTER TABLE proposals 
        ADD CONSTRAINT fk_proposals_batch 
        FOREIGN KEY (batch_id) REFERENCES academic_batches(id) ON DELETE SET NULL
      `);
      console.log('      ✅ Foreign key added for proposals.batch_id');
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_FK_DUP_NAME' || e.errno === 1826 || e.errno === 1022) {
        console.log('      ✅ Foreign key already exists — skipping');
      } else {
        console.warn('      ⚠️  FK warning (non-critical):', e.message);
      }
    }

    // -------------------------------------------------------
    // STEP 2: users.batch_id ensure karo
    // -------------------------------------------------------
    console.log('[2/6] Checking users.batch_id ...');
    try {
      await connection.query(`ALTER TABLE users ADD COLUMN batch_id INT NULL`);
      await connection.query(`
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_batch 
        FOREIGN KEY (batch_id) REFERENCES academic_batches(id) ON DELETE SET NULL
      `);
      console.log('      ✅ users.batch_id column added');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_FK_DUP_NAME' || e.errno === 1826) {
        console.log('      ✅ users.batch_id already exists — skipping');
      } else {
        console.warn('      ⚠️  Warning:', e.message);
      }
    }

    // -------------------------------------------------------
    // STEP 3: users.fyp_phase ensure karo
    // -------------------------------------------------------
    console.log('[3/6] Checking users.fyp_phase ...');
    try {
      await connection.query(`
        ALTER TABLE users ADD COLUMN fyp_phase 
        ENUM('FYP-I', 'FYP-II', 'Not Enrolled') DEFAULT 'Not Enrolled'
      `);
      console.log('      ✅ users.fyp_phase column added');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('      ✅ users.fyp_phase already exists — skipping');
      } else throw e;
    }

    // -------------------------------------------------------
    // STEP 4: academic_batches.track_id ensure karo
    // -------------------------------------------------------
    console.log('[4/6] Checking academic_batches.track_id ...');
    try {
      await connection.query(`ALTER TABLE academic_batches ADD COLUMN track_id INT NULL`);
      await connection.query(`
        ALTER TABLE academic_batches 
        ADD CONSTRAINT fk_batches_track 
        FOREIGN KEY (track_id) REFERENCES milestone_tracks(id) ON DELETE SET NULL
      `);
      console.log('      ✅ academic_batches.track_id added');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_FK_DUP_NAME' || e.errno === 1826) {
        console.log('      ✅ track_id already exists — skipping');
      } else {
        console.warn('      ⚠️  Warning:', e.message);
      }
    }

    // -------------------------------------------------------
    // STEP 5: group_deadline_extensions mein 'granted_by' ensure karo
    //         (trackController reopen uses 'granted_by' column)
    // -------------------------------------------------------
    console.log('[5/6] Checking group_deadline_extensions.granted_by ...');
    
    // First make sure table exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS group_deadline_extensions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        proposal_id INT NOT NULL,
        new_deadline DATETIME NOT NULL,
        reason TEXT,
        granted_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES weekly_tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // If old table has 'created_by' but not 'granted_by', rename it
    try {
      await connection.query(`
        ALTER TABLE group_deadline_extensions 
        CHANGE COLUMN created_by granted_by INT NULL
      `);
      console.log('      ✅ Renamed created_by → granted_by in group_deadline_extensions');
    } catch(e) {
      if (e.code === 'ER_BAD_FIELD_ERROR') {
        // 'created_by' doesn't exist — check if granted_by exists already
        try {
          await connection.query(`ALTER TABLE group_deadline_extensions ADD COLUMN granted_by INT NULL`);
          console.log('      ✅ granted_by column added');
        } catch(e2) {
          if (e2.code === 'ER_DUP_FIELDNAME') {
            console.log('      ✅ granted_by already exists — skipping');
          } else throw e2;
        }
      } else if(e.code === 'ER_DUP_FIELDNAME') {
        console.log('      ✅ granted_by already exists — skipping');
      } else {
        console.warn('      ⚠️  Warning:', e.message);
      }
    }

    // -------------------------------------------------------
    // STEP 6: transition_audits table ensure karo
    // -------------------------------------------------------
    console.log('[6/6] Checking transition_audits table ...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transition_audits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_batch_id INT,
        target_batch_id INT,
        transitioned_by INT,
        override_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_batch_id) REFERENCES academic_batches(id) ON DELETE SET NULL,
        FOREIGN KEY (target_batch_id) REFERENCES academic_batches(id) ON DELETE SET NULL,
        FOREIGN KEY (transitioned_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('      ✅ transition_audits table ready');

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n===========================================');
    console.log('  ✅ Phase 1 Migration COMPLETE!');
    console.log('===========================================');
    console.log('\nDatabase is now ready for Phase 2');
    console.log('(Proposal-Batch linking in proposalController)\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('Code:', err.code);
    await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    process.exit(1);
  } finally {
    connection.release();
  }
}

runPhase1Migration();
