import { createClient } from "@supabase/supabase-js";
import { NextFunction, Request, Response } from "express";

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://anpszskuryudqegtdsmo.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_khNqjRm8zcD27-8c4ZFWrA_-UqEMMx-";

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Middleware to verify Supabase Bearer JWT tokens on protected AI endpoints.
 * In development, allows unauthenticated local requests with a warning if no header is passed,
 * but validates any provided token strictly. In production, authentication is mandatory.
 */
export async function authenticateAiRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  const isDev = process.env.NODE_ENV !== "production";

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    if (isDev) {
      console.warn(
        "[AI Auth] No Bearer token provided. Allowing unauthenticated request in development mode.",
      );
      req.user = { id: "dev-user", username: "DevLifter" };
      return next();
    }
    return res.status(401).json({
      error: "Authentication required to chat with Bro. Please sign in.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const {
      data: { user },
      error,
    } = await supabaseServer.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: "Invalid or expired session. Please re-authenticate.",
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    console.error("[AI Auth Error]:", err.message);
    return res.status(500).json({
      error: "Failed to authenticate session.",
    });
  }
}
