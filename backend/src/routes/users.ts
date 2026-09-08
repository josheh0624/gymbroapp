import { randomUUID } from "crypto";
import Router, { Request, Response } from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import pool from "../db/db";
import { protect } from "../middleware/auth";
import { SafeUser } from "../models/user-model";

const router = Router();

////////////////////
//user routes //

router.get("/", (req: Request, res: Response) => {
  res.send("hello from user route");
});

router.patch("/setup", protect, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { age, height_ft, weight_lbs, sex } = req.body;

  if (!userId) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const query = `
      UPDATE users
      SET age = COALESCE($1, age),
          height_ft = COALESCE($2, height_ft),
          weight_lbs = COALESCE($3, weight_lbs),
          sex = COALESCE($4, sex)
      WHERE id = $5
      RETURNING id, username, email, age, height_ft, weight_lbs, sex, created_at
    `;
    const result = await pool.query(query, [
      age ?? null,
      height_ft ?? null,
      weight_lbs ?? null,
      sex ?? null,
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error setting up user:", err);
    res.status(500).json({ message: "Error setting up user" });
  }
});

router.post("/changeAge", (req: Request, res: Response) => {
  const { age, id } = req.body;

  const query = "UPDATE users SET age = $1 WHERE id = $2";
  pool.query(query, [age, id], (err, result) => {
    if (err) {
      console.error("Error updating user age:", err);
      res.status(500).send("Error updating user age");
    } else {
      res.send("User age updated successfully");
    }
  });
});

const uploadDir = path.join(__dirname, "../../uploads/profile-photos");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      if (!req.user) {
        return cb(new Error("Not authenticated"), "");
      }

      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `${req.user.id}-${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

router.patch(
  "/profile-photo",
  protect,
  upload.single("photo"),
  async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No photo uploaded" });
    }

    const imageUrl = `${process.env.SERVER_URL}/uploads/profile-photos/${req.file.filename}`;

    try {
      const { rows } = await pool.query<SafeUser>(
        `UPDATE users
         SET image_url = $1
         WHERE id = $2
         RETURNING id, username, email, created_at, age, height_ft, weight_lbs, sex, image_url`,
        [imageUrl, req.user.id],
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(rows[0]);
    } catch (err) {
      console.error("Failed to update profile photo:", err);
      res.status(500).json({ error: "Failed to update profile photo" });
    }
  },
);

export default router;
export { router as usersRouter };
