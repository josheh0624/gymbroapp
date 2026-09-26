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
  try {
    await pool.query(
      "ALTER TABLE workout_routines ADD COLUMN is_prebuilt BOOLEAN NOT NULL DEFAULT false;",
    );
    console.log("Column added");
  } catch (err) {
    if (err.code === "42701") console.log("Column already exists");
    else console.error(err);
  }

  // Set existing PPL, Upper/Lower, etc. to prebuilt
  await pool.query(
    "UPDATE workout_routines SET is_prebuilt = true WHERE name IN ('Push Pull Legs (PPL)', 'Upper / Lower', 'Full Body', 'Arnold Split', 'Bro Split')",
  );

  const res = await pool.query(
    "SELECT name, is_prebuilt FROM workout_routines;",
  );
  console.log("Routines:", res.rows);
  pool.end();
}
run();
