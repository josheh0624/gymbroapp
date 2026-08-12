import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../db/db";
import { SafeUser } from "../models/user-model";
dotenv.config();

interface TokenPayload {
  userId: number;
}

//make sure JWT is connected
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

//middleware to
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Get the token from the Authorization header

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    //verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      decoded.userId,
    ]);
    if (user.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }
    // Attach the user to the request object
    const { password_hash, ...safeUser } = user.rows[0];
    req.user = safeUser as SafeUser;
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ message: "Not authorized", error });
  }
};
