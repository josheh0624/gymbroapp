import Router, { Request, Response } from "express";
import pool from "../db/db";
import { protect } from "../middleware/auth";

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

export default router;
export { router as usersRouter };
