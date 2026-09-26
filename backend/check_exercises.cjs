const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  password: process.env.DB_PASSWORD,
});
async function run() {
  const res = await pool.query(`
    SELECT w.name as workout_name, e.name as exercise_name, we.sets, we.reps, we.weight
    FROM workouts w
    JOIN workout_exercises we ON we.workout_id = w.id
    JOIN exercises e ON e.id = we.exercise_id
    WHERE w.name IN ('Push Day', 'Pull Day', 'Leg Day')
    ORDER BY w.name, we.order_index
  `);
  console.log("Exercises in PPL:", res.rows);
  pool.end();
}
run();
