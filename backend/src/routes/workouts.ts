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
  const userId = (req as any).user.id;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return res.status(400).json({ error: "start and end must be YYYY-MM-DD" });
  }

  const completedWorkoutsQuery = `
      WITH completed_workouts AS (
        SELECT we.workout_id AS id, MAX(wl.completed_at) AS completed_at
        FROM workout_log wl
        JOIN workout_exercises we ON we.id = wl.workout_exercise_id
        WHERE wl.user_id = $1
        GROUP BY we.workout_id, (wl.completed_at AT TIME ZONE 'UTC')::date
      )
      SELECT id, completed_at::date AS completed_date
      FROM completed_workouts
      WHERE completed_at::date <= CURRENT_DATE
      ORDER BY completed_date;
    `;

  const muscleHitsQuery = `
      WITH completed_exercises AS (
        SELECT we.workout_id AS id, wl.completed_at, we.exercise_id, wl.id AS log_id
        FROM workout_log wl
        JOIN workout_exercises we ON we.id = wl.workout_exercise_id
        WHERE wl.user_id = $3
      )
      SELECT mg.name AS "muscleGroupName",
             COUNT(DISTINCT ce.log_id)::integer AS "timesHit"
      FROM completed_exercises ce
      JOIN exercises e ON e.id = ce.exercise_id
      JOIN muscle_groups mg ON mg.id = e.muscle_group_id
      WHERE ce.completed_at::date BETWEEN $1::date AND $2::date
      GROUP BY mg.name
      ORDER BY "timesHit" DESC, mg.name;
    `;

  const statsQuery = `
      WITH completed_exercises AS (
        SELECT we.workout_id AS id, wl.completed_at, we.exercise_id, wl.id AS log_id, we.id AS we_id, we.sets, we.reps, we.weight
        FROM workout_log wl
        JOIN workout_exercises we ON we.id = wl.workout_exercise_id
        WHERE wl.user_id = $3
      )
      SELECT COUNT(DISTINCT ce.id)::integer AS "totalWorkouts",
             COALESCE(SUM(ce.sets), 0)::integer AS "totalSets",
             COUNT(ce.we_id)::integer AS "totalExercises",
             COUNT(DISTINCT ce.completed_at::date)::integer AS "daysTrained",
             COALESCE(SUM(ce.weight * ce.reps * ce.sets), 0)::float8 AS "totalVolume",
             COUNT(DISTINCT ce.exercise_id) FILTER (
               WHERE ce.weight IS NOT NULL
                 AND ce.weight = (
                   SELECT MAX(history.weight)
                   FROM workout_exercises history
                   JOIN workout_log hl ON hl.workout_exercise_id = history.id
                   WHERE history.exercise_id = ce.exercise_id AND hl.user_id = $3
                 )
             )::integer AS "personalRecords"
      FROM completed_exercises ce
      WHERE ce.completed_at::date BETWEEN $1::date AND $2::date;
    `;

  const dailyActivityQuery = `
      WITH completed_workouts AS (
        SELECT we.workout_id AS id, MAX(wl.completed_at) AS completed_at
        FROM workout_log wl
        JOIN workout_exercises we ON we.id = wl.workout_exercise_id
        WHERE wl.user_id = $3
        GROUP BY we.workout_id, (wl.completed_at AT TIME ZONE 'UTC')::date
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
    const cwResult = await pool.query(completedWorkoutsQuery, [userId]);
    const muscleHitsResult = await pool.query(muscleHitsQuery, [start, end, userId]);
    const statsResult = await pool.query(statsQuery, [start, end, userId]);
    const dailyActivityResult = await pool.query(dailyActivityQuery, [start, end, userId]);

    // calculate current streak (logic unchanged)
    let streak = 0;
    const completedDates = new Set(
      cwResult.rows.map((row) => row.completed_date.toISOString().split("T")[0])
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(today);
    const todayStr = checkDate.toISOString().split("T")[0];

    if (completedDates.has(todayStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split("T")[0];
      if (completedDates.has(yesterdayStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        streak = 0;
      }
    }

    if (streak > 0) {
      while (true) {
        const str = checkDate.toISOString().split("T")[0];
        if (completedDates.has(str)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    res.json({
      muscleHits: muscleHitsResult.rows,
      stats: {
        ...statsResult.rows[0],
        currentStreak: streak,
      },
      dailyActivity: dailyActivityResult.rows,
    });
  } catch (err) {
    console.error("error muscle-summary:", err);
    res.status(500).json({ error: "Failed to fetch muscle summary" });
  }
});


router.get("/completed-exercises/:workoutId", protect, async (req: Request, res: Response) => {
  const { workoutId } = req.params;
  const dateStr = String(req.query.date ?? "");
  const userId = (req as any).user.id;

  if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return res.status(400).json({ error: "date must start with YYYY-MM-DD" });
  }

  try {
    const result = await pool.query(
      `SELECT wl.workout_exercise_id
       FROM workout_log wl
       JOIN workout_exercises we ON we.id = wl.workout_exercise_id
       WHERE wl.user_id = $1
         AND we.workout_id = $2
         AND (wl.completed_at AT TIME ZONE 'UTC')::date = $3::date`,
      [userId, workoutId, dateStr.substring(0, 10)]
    );

    res.json(result.rows.map(r => r.workout_exercise_id));
  } catch (err) {
    console.error("error completed-exercises:", err);
    res.status(500).json({ error: "Failed to fetch completed exercises" });
  }
});

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
