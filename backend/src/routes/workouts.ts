import Router, { Request, Response } from "express";
import pool from "../db/db";

const router = Router();

//////////////////////////
// WORKOUT ROUTES       //

router.get("/", (req: Request, res: Response) => {
  res.send("hello from workouts route");
});

// static routes before /:id-style routes
router.get("/getAll", async (req: Request, res: Response) => {
  const fetch_query = "SELECT * FROM workouts ORDER BY name";

  try {
    const result = await pool.query(fetch_query);
    res.json(result.rows);
  } catch (err) {
    console.error("error getAll:", err);
    res.status(500).json({ error: "Failed to fetch workouts" });
  }
});

router.get("/fetchWorkout/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  // pull the workout + its exercises in one query
  const fetch_query = `
    SELECT 
      w.id AS workout_id, w.name AS workout_name, w.days,
      e.id AS exercise_id, e.name AS exercise_name,
      we.sets, we.reps, we.order_index
    FROM workouts w
    LEFT JOIN workout_exercises we ON we.workout_id = w.id
    LEFT JOIN exercises e ON e.id = we.exercise_id
    WHERE w.id = $1
    ORDER BY we.order_index;
  `;

  try {
    const result = await pool.query(fetch_query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Workout not found" });
    }

    const rows = result.rows;
    const workout = {
      id: rows[0].workout_id,
      name: rows[0].workout_name,
      days: rows[0].days,
      exercises: rows[0].exercise_id
        ? rows.map((r) => ({
            id: r.exercise_id,
            name: r.exercise_name,
            sets: r.sets,
            reps: r.reps,
            order_index: r.order_index,
          }))
        : [],
    };

    res.json(workout);
  } catch (err) {
    console.error("error fetchWorkout:", err);
    res.status(500).json({ error: "Failed to fetch workout" });
  }
});

router.post("/create", async (req: Request, res: Response) => {
  const { name, days, exercises } = req.body;
  // exercises: [{ exerciseId, sets, reps, orderIndex }]

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const workoutResult = await client.query(
      "INSERT INTO workouts (name, days) VALUES ($1, $2) RETURNING id",
      [name, days || []],
    );
    const workoutId = workoutResult.rows[0].id;

    if (Array.isArray(exercises)) {
      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        await client.query(
          "INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index) VALUES ($1, $2, $3, $4, $5)",
          [workoutId, ex.exerciseId, ex.sets, ex.reps, ex.orderIndex ?? i],
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ id: workoutId, name });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("error create:", err);
    res.status(500).json({ error: "Failed to create workout" });
  } finally {
    client.release();
  }
});

export default router;
export { router as workoutRouter };
