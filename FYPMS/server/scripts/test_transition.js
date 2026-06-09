const mockAdmin = { id: 30 };
const { query } = require('./config/database');
const { transitionBatch } = require('./controllers/curriculumController');

async function test() {
  const batches = await query("SELECT id FROM academic_batches WHERE state = 'Active' AND fyp_phase = 'FYP-I' LIMIT 1");
  if (!batches || !batches.length) {
    console.log("No active FYP-I batch found to transition.");
    return;
  }
  const sourceBatchId = batches[0].id;
  const req = {
    body: {
      sourceBatchId,
      override: true,
      override_reason: 'Testing transition bug'
    },
    user: mockAdmin
  };
  
  const res = {
    status: (code) => ({
      json: (data) => console.log(`CODE: ${code}`, JSON.stringify(data))
    })
  };

  await transitionBatch(req, res);
}
test().then(() => process.exit(0)).catch(e => console.error(e));
