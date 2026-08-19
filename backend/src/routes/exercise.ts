import Router, { Request, Response } from "express";
import pool from "../db/db";

const router = Router();

////////////////////
//exercise routes //

router.get("/", (req: Request, res: Response) => {
  res.send("hello from exercise route");
});

//create exercise

router.post("/create", async (req: Request, res: Response) => {
  const { name, muscleGroupId } = req.body;

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  const insert_query =
    "INSERT INTO exercises (name, muscle_group_id) VALUES ($1, $2) RETURNING id, name";

  try {
    const result = await pool.query(insert_query, [
      name,
      muscleGroupId ?? null,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("error create:", err);
    res.status(500).json({ error: "Failed to create exercise" });
  }
});

//get all exercises

router.get("/getAll", async (req: Request, res: Response) => {
  const fetch_query = `
    SELECT e.id, e.name, e.muscle_group_id, mg.name AS muscle_group_name
    FROM exercises e
    LEFT JOIN muscle_groups mg ON mg.id = e.muscle_group_id
    ORDER BY e.name;
  `;

  try {
    const result = await pool.query(fetch_query);
    res.json(result.rows);
  } catch (err) {
    console.error("error getAll:", err);
    res.status(500).json({ error: "Failed to fetch exercises" });
  }
});

//get an exercise by id

router.get("/fetchExercise/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const fetch_query = `
    SELECT e.id, e.name, e.muscle_group_id, mg.name AS muscle_group_name
    FROM exercises e
    LEFT JOIN muscle_groups mg ON mg.id = e.muscle_group_id
    WHERE e.id = $1;
  `;

  try {
    const result = await pool.query(fetch_query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("error fetchExercise:", err);
    res.status(500).json({ error: "Failed to fetch exercise" });
  }
});

//update exercise data

router.put("/updateExercise/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, muscleGroupId } = req.body;

  const update_query = `
    UPDATE exercises
    SET name = COALESCE($2, name),
        muscle_group_id = COALESCE($3, muscle_group_id)
    WHERE id = $1
    RETURNING id, name, muscle_group_id;
  `;

  try {
    const result = await pool.query(update_query, [
      id,
      name ?? null,
      muscleGroupId ?? null,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("error updateExercise:", err);
    res.status(500).json({ error: "Failed to update exercise" });
  }
});

// delete exercise

router.delete("/deleteExercise/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const delete_query = "DELETE FROM exercises WHERE id = $1 RETURNING id";

  try {
    const result = await pool.query(delete_query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error("error deleteExercise:", err);
    res.status(500).json({ error: "Failed to delete exercise" });
  }
});

export default router;
export { router as exerciseRouter };
