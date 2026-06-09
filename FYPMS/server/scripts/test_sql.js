const mysql = require('mysql2/promise');
require('dotenv').config({path: '../../.env'});

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      database: 'fypms_db'
    });
    const phase = 'FYP-I';
    const supervisor_id = 43;
    const sap_id = null;
    const batch_id = 'all';

    const [rows] = await conn.query(`
            SELECT 
                p.batch_id                            AS batch_id,
                p.id                                  AS proposal_id,
                p.project_title                       AS project_title,
                u.sap_id                              AS student_sap_id,
                u.username                            AS student_name,
                IF(u.id = p.student_id, 'Leader', 'Member') AS student_role,
                COALESCE(sm.status, 'NOT_STARTED')    AS evaluation_status,
                sm.id                                 AS marks_id,
                sm.lo1_marks, sm.lo2_marks, sm.lo3_marks, sm.lo4_marks,
                sm.lo5_marks, sm.lo6_marks, sm.lo7_marks, sm.lo8_marks,
                sm.total_marks,
                EXISTS (
                    SELECT 1 
                    FROM defense_submissions ds 
                    WHERE ds.proposal_id = p.id 
                    AND ds.submission_status = 'evaluated'
                ) AS is_committee_done
            FROM proposals p
            JOIN users u 
                ON u.id = p.student_id 
                OR u.sap_id COLLATE utf8mb4_unicode_ci IN (
                    SELECT sap_id COLLATE utf8mb4_unicode_ci 
                    FROM proposal_members 
                    WHERE proposal_id = p.id AND status = 'accepted'
                )
            LEFT JOIN supervisor_marks sm 
                ON  p.id          = sm.proposal_id 
                AND u.sap_id COLLATE utf8mb4_unicode_ci = sm.student_sap_id COLLATE utf8mb4_unicode_ci
                AND sm.fyp_phase  = ?
            WHERE p.status       = 'approved'
              AND (p.supervisor_id = ? OR p.supervisor_sap_id COLLATE utf8mb4_unicode_ci = ?)
              ${batch_id !== 'all' ? 'AND p.batch_id = ?' : ''}
            ORDER BY p.batch_id, p.id, student_role DESC, u.username
        `, batch_id !== 'all' ? [phase, supervisor_id, sap_id || null, batch_id] : [phase, supervisor_id, sap_id || null]);

    console.log('SUCCESS:', rows);
    process.exit(0);
  } catch(e) {
    console.error('SQL ERROR:', e.message);
    process.exit(1);
  }
}

test();
