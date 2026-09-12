const { Pool } = require('pg');
const pool = new Pool({ user: 'joshhaney', host: 'localhost', database: 'workoutroutines', port: 5432, password: 'StormS503' });
async function run() {
  const res = await pool.query('SELECT id, name, is_prebuilt FROM workout_routines;');
  console.log('Routines:', res.rows);
  pool.end();
}
run();
