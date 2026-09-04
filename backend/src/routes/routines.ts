import Router, { Request, Response } from "express";
import pool from "../db/db";

const router = Router();

//////////////////////////
// ROUTINE ROUTES       //

router.get("/", (req: Request, res: Response) => {
  res.send("hello from routines route");
});

// static routes before /:id-style routes
router.get("/getAll", async (req: Request, res: Response) => {
  const fetch_query = `
    SELECT 
      r.id,
      r.name,
      COUNT(wrd.workout_id) AS workout_count
    FROM workout_routines r
    LEFT JOIN workout_routine_days wrd ON wrd.routine_id = r.id
    GROUP BY r.id, r.name
    ORDER BY r.name;
  `;

  try {
    const result = await pool.query(fetch_query);
    res.json(result.rows);
  } catch (err) {
    console.error("error getAll:", err);
    res.status(500).json({ error: "Failed to fetch routines" });
  }
});

router.get("/fetchRoutine/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const fetch_query = `
  SELECT 
    r.id AS routine_id, r.name AS routine_name,
    wrd.order_index AS day_order,
    w.id AS workout_id, w.name AS workout_name, w.days,
    e.id AS exercise_id, e.name AS exercise_name,
    mg.name AS muscle_group_name,
    we.id AS workout_exercise_id,
    we.sets, we.reps, we.order_index AS exercise_order,
    we.weight, we.is_done
  FROM workout_routines r
  JOIN workout_routine_days wrd ON wrd.routine_id = r.id
  JOIN workouts w ON w.id = wrd.workout_id
  JOIN workout_exercises we ON we.workout_id = w.id
  JOIN exercises e ON e.id = we.exercise_id
  LEFT JOIN muscle_groups mg ON mg.id = e.muscle_group_id
  WHERE r.id = $1
  ORDER BY wrd.order_index, we.order_index;
`;

  try {
    const result = await pool.query(fetch_query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Routine not found" });
    }

    const rows = result.rows;
    const routine = {
      id: rows[0].routine_id,
      name: rows[0].routine_name,
      workouts: [] as any[],
    };

    const workoutMap = new Map<string, any>();
    for (const row of rows) {
      if (!workoutMap.has(row.workout_id)) {
        const workout = {
          id: row.workout_id,
          name: row.workout_name,
          days: row.days,
          order_index: row.day_order,
          exercises: [] as any[],
        };
        workoutMap.set(row.workout_id, workout);
        routine.workouts.push(workout);
      }
      workoutMap.get(row.workout_id).exercises.push({
        id: row.exercise_id,
        workoutExerciseId: row.workout_exercise_id,
        name: row.exercise_name,
        muscleGroupName: row.muscle_group_name,
        sets: row.sets,
        reps: row.reps,
        orderIndex: row.exercise_order,
        weight: row.weight,
        isDone: row.is_done,
      });
    }

    res.json(routine);
  } catch (err) {
    console.error("error fetchRoutine:", err);
    res.status(500).json({ error: "Failed to fetch routine" });
  }
});

// Toggle a single exercise's done state — :id is workout_exercises.id
router.patch("/markExerciseDone/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isDone } = req.body as { isDone: boolean };

  if (typeof isDone !== "boolean") {
    return res.status(400).json({ error: "isDone (boolean) is required" });
  }

  try {
    const result = await pool.query(
      `UPDATE workout_exercises
       SET is_done = $1
       WHERE id = $2
       RETURNING id, is_done`,
      [isDone, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("error markExerciseDone:", err);
    res.status(500).json({ error: "Failed to update exercise" });
  }
});

// Finish a whole workout — :id is workouts.id, marks every exercise in it done
router.put(
  ["/workoutDone/:id", "/markDone/:id"],
  async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const workoutResult = await pool.query(
        "SELECT id FROM workouts WHERE id = $1",
        [id],
      );

      if (workoutResult.rows.length === 0) {
        return res.status(404).json({ error: "Workout not found" });
      }

      const result = await pool.query(
        `UPDATE workout_exercises
       SET is_done = true
       WHERE workout_id = $1
       RETURNING id, is_done`,
        [id],
      );

      res.json({ workoutId: id, workoutDone: true, updated: result.rows });
    } catch (err) {
      console.error("error markDone:", err);
      res.status(500).json({ error: "Failed to mark workout done" });
    }
  },
);

router.post("/create", async (req: Request, res: Response) => {
  const { name, workoutIds } = req.body; // workoutIds: string[] of workout UUIDs, in order

  if (!name || !Array.isArray(workoutIds) || workoutIds.length === 0) {
    return res
      .status(400)
      .json({ error: "name and workoutIds[] are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const routineResult = await client.query(
      "INSERT INTO workout_routines (name) VALUES ($1) RETURNING id",
      [name],
    );
    const routineId = routineResult.rows[0].id;

    for (let i = 0; i < workoutIds.length; i++) {
      await client.query(
        "INSERT INTO workout_routine_days (routine_id, workout_id, order_index) VALUES ($1, $2, $3)",
        [routineId, workoutIds[i], i],
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ id: routineId, name });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("error create:", err);
    res.status(500).json({ error: "Failed to create routine" });
  } finally {
    client.release();
  }
});

export default router;
export { router as routineRouter };
