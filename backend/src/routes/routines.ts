import Router, { Request, Response } from "express";
import pool from "../db/db";
import { protect } from "../middleware/auth";

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
      r.is_prebuilt,
      COUNT(wrd.workout_id) AS workout_count
    FROM workout_routines r
    LEFT JOIN workout_routine_days wrd ON wrd.routine_id = r.id
    GROUP BY r.id, r.name, r.is_prebuilt
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
    we.weight::float8 AS weight, false AS is_done
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
router.patch("/markExerciseDone/:id", protect, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isDone, completedAt } = req.body as any;
  const userId = (req as any).user.id;

  try {
    if (isDone) {
      await pool.query(
        `INSERT INTO workout_log (user_id, workout_exercise_id, completed_at)
         VALUES ($1, $2, COALESCE($3::timestamptz, NOW()))
         ON CONFLICT (user_id, workout_exercise_id, ((completed_at AT TIME ZONE 'UTC')::date))
         DO UPDATE SET completed_at = EXCLUDED.completed_at`,
        [userId, id, completedAt || null]
      );
    } else {
      await pool.query(
        `DELETE FROM workout_log 
         WHERE user_id = $1 AND workout_exercise_id = $2 AND (completed_at AT TIME ZONE 'UTC')::date = (COALESCE($3::timestamptz, NOW()) AT TIME ZONE 'UTC')::date`,
        [userId, id, completedAt || null]
      );
    }
    res.json({ success: true });
  } catch(err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update exercise" });
  }
});

router.patch(
  "/updateExerciseDetails/:id",
  protect,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { weight, reps, sets } = req.body as {
      weight?: number | null;
      reps?: number;
      sets?: number;
    };

    if (
      (weight !== undefined && weight !== null && typeof weight !== "number") ||
      (reps !== undefined && typeof reps !== "number") ||
      (sets !== undefined && typeof sets !== "number") ||
      (weight !== undefined && weight !== null && weight < 0) ||
      (reps !== undefined && reps <= 0) ||
      (sets !== undefined && sets <= 0)
    ) {
      return res
        .status(400)
        .json({ error: "weight, reps, and sets must be valid numbers" });
    }

    try {
      const result = await pool.query(
        `UPDATE workout_exercises
         SET weight = CASE WHEN $1 THEN $2 ELSE weight END,
           reps = CASE WHEN $3 THEN $4 ELSE reps END,
           sets = CASE WHEN $5 THEN $6 ELSE sets END
         WHERE id = $7
      RETURNING id, weight::float8 AS weight, reps, sets`,
        [
          weight !== undefined,
          weight ?? null,
          reps !== undefined,
          reps ?? null,
          sets !== undefined,
          sets ?? null,
          id,
        ],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Exercise not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error("error updateExerciseDetails:", err);
      res.status(500).json({ error: "Failed to update exercise details" });
    }
  },
);

// Finish a whole workout — :id is workouts.id, marks every exercise in it done
router.put(["/workoutDone/:id", "/markDone/:id"], protect, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { doneExerciseIds, completedAt } = req.body as any;
  const userId = (req as any).user.id;

  try {
    const workoutResult = await pool.query("SELECT id FROM workouts WHERE id = $1", [id]);
    if (workoutResult.rows.length === 0) return res.status(404).json({ error: "Workout not found" });

    if (doneExerciseIds && doneExerciseIds.length > 0) {
      await pool.query(
        `INSERT INTO workout_log (user_id, workout_exercise_id, completed_at)
         SELECT $1, unnest($2::uuid[]), COALESCE($3::timestamptz, NOW())
         ON CONFLICT (user_id, workout_exercise_id, ((completed_at AT TIME ZONE 'UTC')::date))
         DO UPDATE SET completed_at = EXCLUDED.completed_at`,
         [userId, doneExerciseIds, completedAt || null]
      );
    }

    await pool.query(
      `DELETE FROM workout_log wl
       USING workout_exercises we
       WHERE wl.workout_exercise_id = we.id
         AND we.workout_id = $2
         AND wl.user_id = $1
         AND (wl.completed_at AT TIME ZONE 'UTC')::date = (COALESCE($3::timestamptz, NOW()) AT TIME ZONE 'UTC')::date
         AND ($4::uuid[] IS NULL OR NOT (we.id = ANY($4::uuid[])))`,
      [userId, id, completedAt || null, doneExerciseIds && doneExerciseIds.length > 0 ? doneExerciseIds : null]
    );

    res.json({ workoutId: id, workoutDone: true });
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark workout done" });
  }
});

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

router.put("/update/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, workoutIds } = req.body;

  if (!name || !Array.isArray(workoutIds) || workoutIds.length === 0) {
    return res
      .status(400)
      .json({ error: "name and workoutIds[] are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Check if exists
    const check = await client.query(
      "SELECT id FROM workout_routines WHERE id = $1",
      [id],
    );
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Routine not found" });
    }

    // Update name
    await client.query("UPDATE workout_routines SET name = $1 WHERE id = $2", [
      name,
      id,
    ]);

    // Replace workouts
    await client.query(
      "DELETE FROM workout_routine_days WHERE routine_id = $1",
      [id],
    );
    for (let i = 0; i < workoutIds.length; i++) {
      await client.query(
        "INSERT INTO workout_routine_days (routine_id, workout_id, order_index) VALUES ($1, $2, $3)",
        [id, workoutIds[i], i],
      );
    }

    await client.query("COMMIT");
    res.json({ id, name, updated: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("error update routine:", err);
    res.status(500).json({ error: "Failed to update routine" });
  } finally {
    client.release();
  }
});

router.delete("/delete/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM workout_routines WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Routine not found" });
    }

    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) {
    console.error("error delete routine:", err);
    res.status(500).json({ error: "Failed to delete routine" });
  }
});

export default router;
export { router as routineRouter };
