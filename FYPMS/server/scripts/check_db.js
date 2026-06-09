const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../config/database');

async function run() {
    try {
        const p = await query('DESCRIBE proposals');
        console.log('PROPOSALS:', p.map(c => c.Field).join(', '));
        const pm = await query('DESCRIBE proposal_members');
        console.log('PROPOSAL_MEMBERS:', pm.map(c => c.Field).join(', '));
        const f = await query('DESCRIBE final_grades');
        console.log('FINAL_GRADES:', f.map(c => c.Field).join(', '));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
