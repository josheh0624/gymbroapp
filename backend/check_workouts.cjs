const { Pool } = require('pg');
const pool = new Pool({ user: 'joshhaney', host: 'localhost', database: 'workoutroutines', port: 5432, password: 'StormS503' });
async function run() {
  const res = await pool.query(`
    SELECT r.name as routine_name, w.name as workout_name
    FROM workout_routines r
    LEFT JOIN workout_routine_days wrd ON wrd.routine_id = r.id
    LEFT JOIN workouts w ON w.id = wrd.workout_id
    WHERE r.name = 'Push Pull Legs'
  `);
  console.log('Workouts in PPL:', res.rows);
  pool.end();
}
run();
