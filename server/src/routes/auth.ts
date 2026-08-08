import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../db/db";
import { protect } from "../middleware/auth";
import { SafeUser } from "../models/user-model";

const router = express.Router();

//convert JWT_SECRET to a string
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

//generate a JWT token for the user
const generateToken = (userId: number) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "30d",
  });
};

// =========================
// REGISTER ROUTE
// =========================
router.post("/register", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  try {
    //make sure all fields are filled out
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Please fill out all fields" });
    }

    //check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    //hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //insert the new user into the database
    const newUser = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword],
    );

    const { password_hash: _pw, ...safeUser } = newUser.rows[0];
    //generate JWT token for new user
    const token = generateToken(newUser.rows[0].id);

    return res.status(201).json({ user: safeUser as SafeUser, token });
  } catch (error) {
    return res.status(500).json({ message: "Error registering user", error });
  }
});
// =========================
// LOGIN ROUTE
// =========================
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    //make sure all fields are filled out
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill out all fields" });
    }

    //check if user exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (existingUser.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    //save the user data
    const userData = existingUser.rows[0];

    //compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, userData.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(userData.id);
    //return the user data and the JWT token
    res.json({
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
      } as SafeUser,
      token,
    });

    return;
  } catch (error) {
    return res.status(500).json({ message: "Error logging in", error });
  }
});

// =========================
// me route to get the current user
// =========================
router.get("/me", protect, async (req: Request, res: Response) => {
  res.json(req.user); //return info of logged in user from protect middleware
});

// =========================
// LOGOUT ROUTE
// =========================
router.post("/logout", async (req: Request, res: Response) => {
  try {
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error logging out", error });
  }
});

export default router;
