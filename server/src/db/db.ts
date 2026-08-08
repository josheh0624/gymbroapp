import dotenv from "dotenv";
import { Pool } from "pg";
dotenv.config();

const pool = new Pool({
  //connect to database
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("connect", () => {
  console.log("connected to the database");
});

pool.on("error", (err) => {
  console.error("database error:", err);
});

export default pool;
