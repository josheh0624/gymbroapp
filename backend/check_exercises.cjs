const { Pool } = require('pg');
const pool = new Pool({ user: 'joshhaney', host: 'localhost', database: 'workoutroutines', port: 5432, password: 'StormS503' });
async function run() {
  const res = await pool.query(`
    SELECT w.name as workout_name, e.name as exercise_name, we.sets, we.reps, we.weight
    FROM workouts w
    JOIN workout_exercises we ON we.workout_id = w.id
    JOIN exercises e ON e.id = we.exercise_id
    WHERE w.name IN ('Push Day', 'Pull Day', 'Leg Day')
    ORDER BY w.name, we.order_index
  `);
  console.log('Exercises in PPL:', res.rows);
  pool.end();
}
run();
