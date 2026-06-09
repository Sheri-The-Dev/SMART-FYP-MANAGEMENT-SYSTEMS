const path = require('path');
require('dotenv').config();
const { pool } = require('./config/database');

const migrate = async () => {
  const connection = await pool.getConnection();
  try {
    console.log('🚀 Starting migration...');

    // Add status and invitation_token to proposal_members
    await connection.execute(`
      ALTER TABLE proposal_members 
      ADD COLUMN IF NOT EXISTS status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(255) UNIQUE;
    `);
    console.log('✅ Updated proposal_members table');

    // Add 'pending_member_confirmation' to proposals status ENUM
    // Note: MySQL doesn't support ADD IF NOT EXISTS for ENUM values easily in a single ALTER
    // We'll check if it exists first or just try to add it.
    // In many environments, we can just redeclare the ENUM.
    
    const [rows] = await connection.execute("SHOW COLUMNS FROM proposals LIKE 'status'");
    const statusType = rows[0].Type;
    if (!statusType.includes('pending_member_confirmation')) {
      const newStatusType = statusType.replace(")", ",'pending_member_confirmation')");
      await connection.execute(`ALTER TABLE proposals MODIFY COLUMN status ${newStatusType}`);
      console.log('✅ Updated proposals table status ENUM');
    } else {
      console.log('ℹ️ proposals table status already has pending_member_confirmation');
    }

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    connection.release();
    process.exit();
  }
};

migrate();
