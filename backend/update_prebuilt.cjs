const { Pool } = require('pg');
const pool = new Pool({ user: 'joshhaney', host: 'localhost', database: 'workoutroutines', port: 5432, password: 'StormS503' });
async function run() {
  await pool.query("UPDATE workout_routines SET is_prebuilt = true WHERE name = 'Push Pull Legs'");
  const res = await pool.query('SELECT name, is_prebuilt FROM workout_routines;');
  console.log('Routines:', res.rows);
  pool.end();
}
run();
