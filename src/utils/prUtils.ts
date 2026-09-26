import { supabase } from "@/api/supabase";

export type PRType = "bench_pr" | "squat_pr" | "deadlift_pr";

export interface ExercisePRCheck {
  id?: string;
  name?: string;
  weight?: number | null;
  isDone?: boolean;
}

/**
 * Categorizes an exercise as Bench Press, Squat, or Deadlift for PR tracking.
 * Returns null if the exercise is not one of the Big 3 or is an accessory/variation.
 */
export function detectPRType(exercise: {
  id?: string;
  name?: string;
}): PRType | null {
  // Check known IDs from prebuilt routines
  if (exercise.id) {
    const idLower = exercise.id.toLowerCase();
    if (idLower === "bench" || idLower === "bench-press") return "bench_pr";
    if (idLower === "squat") return "squat_pr";
    if (idLower === "rdl" || idLower === "deadlift") return "deadlift_pr";
  }

  if (!exercise.name) return null;
  const name = exercise.name.trim().toLowerCase();

  // Bench Press
  // Standard powerlifting / gym bench PR refers to flat barbell bench press.
  // Exclude accessories/variations: incline, decline, close grip, dumbbell/db, dips, etc.
  if (
    name.includes("bench") &&
    !name.includes("incline") &&
    !name.includes("decline") &&
    !name.includes("close") &&
    !name.includes("dip") &&
    !name.includes("dumbbell") &&
    !/\bdb\b/.test(name)
  ) {
    if (
      name.includes("press") ||
      name === "bench" ||
      name.includes("barbell")
    ) {
      return "bench_pr";
    }
  }

  // Squat
  // Standard squat PR refers to barbell back squat / squat.
  // Exclude accessories: hack, split, bulgarian, goblet, sissy, smith, jump, front
  if (
    name.includes("squat") &&
    !name.includes("hack") &&
    !name.includes("split") &&
    !name.includes("bulgarian") &&
    !name.includes("goblet") &&
    !name.includes("sissy") &&
    !name.includes("smith") &&
    !name.includes("jump")
  ) {
    return "squat_pr";
  }

  // Deadlift
  // Standard deadlift PR refers to conventional, sumo, barbell deadlift, or RDL from prebuilts.
  // Exclude non-deadlift movements like dead hang, single leg, dumbbell/db
  if (
    name.includes("deadlift") &&
    !name.includes("dead hang") &&
    !name.includes("single leg") &&
    !name.includes("dumbbell") &&
    !/\bdb\b/.test(name)
  ) {
    return "deadlift_pr";
  }

  return null;
}

/**
 * Checks completed workout exercises against the user's stored PRs in Supabase Auth user_metadata.
 * If any performed weight exceeds the current record, it automatically updates the PR.
 */
export async function checkAndUpdatePRs(
  exercises: ExercisePRCheck[],
): Promise<Partial<Record<PRType, number>>> {
  try {
    const candidates = exercises.filter(
      (e) => e.isDone !== false && typeof e.weight === "number" && e.weight > 0,
    );

    if (candidates.length === 0) return {};

    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !authUser) {
      console.warn("checkAndUpdatePRs: User is not authenticated");
      return {};
    }

    const metadata = authUser.user_metadata || {};
    const currentPRs: Record<PRType, number> = {
      bench_pr: Number(metadata.bench_pr) || 0,
      squat_pr: Number(metadata.squat_pr) || 0,
      deadlift_pr: Number(metadata.deadlift_pr) || 0,
    };

    const updates: Partial<Record<PRType, number>> = {};

    for (const ex of candidates) {
      const prType = detectPRType(ex);
      if (!prType) continue;

      const performedWeight = Math.round(ex.weight!);
      const currentHighest = updates[prType] ?? currentPRs[prType];

      if (performedWeight > currentHighest) {
        updates[prType] = performedWeight;
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: updates,
      });

      if (updateError) {
        console.error("checkAndUpdatePRs: Failed to update PRs:", updateError);
        return {};
      }

      console.log("checkAndUpdatePRs: Successfully updated PRs:", updates);
      return updates;
    }

    return {};
  } catch (err) {
    console.error("checkAndUpdatePRs error:", err);
    return {};
  }
}
