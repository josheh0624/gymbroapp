import Router, { Request, Response } from "express";
import pool from "../db/db";
import { protect } from "../middleware/auth";

const router = Router();

//////////////////////////
// WORKOUT ROUTES       //

router.get("/", (req: Request, res: Response) => {
  res.send("hello from workouts route");
});

router.get("/muscle-summary", protect, async (req: Request, res: Response) => {
  const start = String(req.query.start ?? "");
  const end = String(req.query.end ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return res.status(400).json({ error: "start and end must be YYYY-MM-DD" });
  }

  const completedWorkoutsQuery = `
      WITH completed_workouts AS (
        SELECT w.id, MAX(we.completed_at) AS completed_at
        FROM workouts w
        JOIN workout_exercises we ON we.workout_id = w.id
        GROUP BY w.id
        HAVING BOOL_AND(we.is_done)
      )
      SELECT id, completed_at::date AS completed_date
      FROM completed_workouts
      WHERE completed_at::date <= CURRENT_DATE
      ORDER BY completed_date;
    `;

  const muscleHitsQuery = `
      WITH completed_workouts AS (
        SELECT w.id, MAX(we.completed_at) AS completed_at
        FROM workouts w
        JOIN workout_exercises we ON we.workout_id = w.id
        GROUP BY w.id
        HAVING BOOL_AND(we.is_done)
      )
      SELECT mg.name AS "muscleGroupName",
             COUNT(DISTINCT cw.id)::integer AS "timesHit"
      FROM completed_workouts cw
      JOIN workout_exercises we ON we.workout_id = cw.id
      JOIN exercises e ON e.id = we.exercise_id
      JOIN muscle_groups mg ON mg.id = e.muscle_group_id
      WHERE cw.completed_at::date BETWEEN $1::date AND $2::date
      GROUP BY mg.name
      ORDER BY "timesHit" DESC, mg.name;
    `;

  const statsQuery = `
      WITH completed_workouts AS (
        SELECT w.id, MAX(we.completed_at) AS completed_at
        FROM workouts w
        JOIN workout_exercises we ON we.workout_id = w.id
        GROUP BY w.id
        HAVING BOOL_AND(we.is_done)
      )
      SELECT COUNT(DISTINCT cw.id)::integer AS "totalWorkouts",
             COALESCE(SUM(we.sets), 0)::integer AS "totalSets",
             COUNT(we.id)::integer AS "totalExercises",
             COUNT(DISTINCT cw.completed_at::date)::integer AS "daysTrained",
             COALESCE(SUM(we.weight * we.reps * we.sets), 0)::float8 AS "totalVolume",
             COUNT(DISTINCT we.exercise_id) FILTER (
               WHERE we.weight IS NOT NULL
                 AND we.weight = (
                   SELECT MAX(history.weight)
                   FROM workout_exercises history
                   WHERE history.exercise_id = we.exercise_id
                 )
             )::integer AS "personalRecords"
      FROM completed_workouts cw
      JOIN workout_exercises we ON we.workout_id = cw.id
      WHERE cw.completed_at::date BETWEEN $1::date AND $2::date;
    `;

  const dailyActivityQuery = `
      WITH completed_workouts AS (
        SELECT w.id, MAX(we.completed_at) AS completed_at
        FROM workouts w
        JOIN workout_exercises we ON we.workout_id = w.id
        GROUP BY w.id
        HAVING BOOL_AND(we.is_done)
      ), days AS (
        SELECT generate_series($1::date, $2::date, '1 day'::interval)::date AS date
      )
      SELECT to_char(days.date, 'YYYY-MM-DD') AS date,
             (COUNT(cw.id) > 0) AS trained,
             COUNT(cw.id)::integer AS "workoutCount"
      FROM days
      LEFT JOIN completed_workouts cw ON cw.completed_at::date = days.date
      GROUP BY days.date
      ORDER BY days.date;
    `;

  try {
    const [muscleHits, stats, dailyActivity, completedWorkouts] =
      await Promise.all([
        pool.query(muscleHitsQuery, [start, end]),
        pool.query(statsQuery, [start, end]),
        pool.query(dailyActivityQuery, [start, end]),
        pool.query(completedWorkoutsQuery),
      ]);

    const completedDates = new Set(
      completedWorkouts.rows.map((row) =>
        new Date(row.completed_date).toISOString().slice(0, 10),
      ),
    );
    let currentStreak = 0;
    const cursor = new Date();
    cursor.setUTCHours(0, 0, 0, 0);
    while (completedDates.has(cursor.toISOString().slice(0, 10))) {
      currentStreak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    res.json({
      muscleHits: muscleHits.rows,
      stats: { ...stats.rows[0], currentStreak },
      dailyActivity: dailyActivity.rows,
    });
  } catch (err) {
    console.error("error muscle-summary:", err);
    res.status(500).json({ error: "Failed to fetch muscle summary" });
  }
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

  const fetch_query = `
    SELECT 
      w.id AS workout_id, w.name AS workout_name, w.days,
      e.id AS exercise_id, e.name AS exercise_name,
      mg.name AS muscle_group_name,
      we.id AS workout_exercise_id,
      we.sets, we.reps, we.weight, we.is_done,
      we.order_index AS exercise_order
    FROM workouts w
    LEFT JOIN workout_exercises we ON we.workout_id = w.id
    LEFT JOIN exercises e ON e.id = we.exercise_id
    LEFT JOIN muscle_groups mg ON mg.id = e.muscle_group_id
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
            workoutExerciseId: r.workout_exercise_id,
            name: r.exercise_name,
            muscleGroupName: r.muscle_group_name,
            sets: r.sets,
            reps: r.reps,
            weight: r.weight,
            isDone: r.is_done,
            orderIndex: r.exercise_order,
          }))
        : [],
    };

    res.json(workout);
  } catch (err) {
    console.error("error fetchWorkout:", err);
    res.status(500).json({ error: "Failed to fetch workout" });
  }
});

router.get(
  "/fetchWorkoutExercises/:id",
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const fetch_query = `
    SELECT 
      e.id AS exercise_id, e.name AS exercise_name,
      mg.name AS muscle_group_name,
      we.id AS workout_exercise_id,
      we.sets, we.reps, we.weight, we.is_done,
      we.order_index AS exercise_order
    FROM workout_exercises we
    JOIN exercises e ON e.id = we.exercise_id
    LEFT JOIN muscle_groups mg ON mg.id = e.muscle_group_id
    WHERE we.workout_id = $1
    ORDER BY we.order_index;
  `;

    try {
      const result = await pool.query(fetch_query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Workout exercises not found" });
      }

      const exercises = result.rows.map((r) => ({
        id: r.exercise_id,
        workoutExerciseId: r.workout_exercise_id,
        name: r.exercise_name,
        muscleGroupName: r.muscle_group_name,
        sets: r.sets,
        reps: r.reps,
        weight: r.weight,
        isDone: r.is_done,
        orderIndex: r.exercise_order,
      }));

      res.json(exercises);
    } catch (err) {
      console.error("error fetchWorkoutExercises:", err);
      res.status(500).json({ error: "Failed to fetch workout exercises" });
    }
  },
);

router.post("/create", async (req: Request, res: Response) => {
  const { name, days, exercises } = req.body;
  // exercises: [{ exerciseId, sets, reps, weight, orderIndex }]

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
          "INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, order_index) VALUES ($1, $2, $3, $4, $5, $6)",
          [
            workoutId,
            ex.exerciseId,
            ex.sets,
            ex.reps,
            ex.weight ?? null,
            ex.orderIndex ?? i,
          ],
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
