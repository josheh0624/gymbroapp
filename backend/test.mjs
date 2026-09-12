import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/gymbroapp' });

async function run() {
  try {
    const res = await pool.query(`SELECT * FROM routine_exercise_progress`);
    console.log("routine_exercise_progress:", res.rows);
  } catch(e) {
    console.error("Error:", e);
  }
  pool.end();
}
run();
