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
  await pool.query(
    "UPDATE workout_routines SET is_prebuilt = true WHERE name = 'Push Pull Legs'",
  );
  const res = await pool.query(
    "SELECT name, is_prebuilt FROM workout_routines;",
  );
  console.log("Routines:", res.rows);
  pool.end();
}
run();
