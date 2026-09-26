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
    SELECT r.name as routine_name, w.name as workout_name
    FROM workout_routines r
    LEFT JOIN workout_routine_days wrd ON wrd.routine_id = r.id
    LEFT JOIN workouts w ON w.id = wrd.workout_id
    WHERE r.name = 'Push Pull Legs'
  `);
  console.log("Workouts in PPL:", res.rows);
  pool.end();
}
run();
