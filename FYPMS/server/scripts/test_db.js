const mysql = require('mysql2/promise');
require('dotenv').config({path: '../../.env'});

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'fypms_db'
    });

    const [t1] = await conn.query('SHOW TABLES LIKE "evaluation_sessions"');
    const [t2] = await conn.query('SHOW TABLES LIKE "final_results"');
    const [t3] = await conn.query('DESCRIBE academic_batches');
    const [t4] = await conn.query('SHOW TABLES LIKE "committee_evaluations"');

    console.log('evaluation_sessions exists:', t1.length > 0);
    console.log('final_results exists:', t2.length > 0);
    console.log('committee_evaluations exists:', t4.length > 0);
    console.log('academic_batches columns:', t3.map(r => r.Field).join(', '));
    process.exit(0);
  } catch(e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}

test();
