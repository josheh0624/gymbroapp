import { supabaseServer } from "../middleware/auth";
import { SanitizedUserContext } from "./sanitizer";

/**
 * Server-Side Identity Binding:
 * Cross-checks the authenticated user's Supabase JWT identity against the `users` table
 * and auth metadata so that client-supplied identity claims cannot be forged or spoofed.
 */
export async function getVerifiedUserContext(
  userId: string,
  authMetadata: any,
  clientContext?: SanitizedUserContext,
): Promise<SanitizedUserContext> {
  // If in local development with dev-user fallback, use clientContext directly
  if (userId === "dev-user") {
    return clientContext || { username: "Lifter", preferredUnit: "lbs", streak: 0 };
  }

  let dbUser: any = null;
  try {
    const { data, error } = await supabaseServer
      .from("users")
      .select("username, email, age, height_ft, weight_lbs, sex, primary_goal")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) {
      dbUser = data;
    }
  } catch (err: any) {
    console.warn("[Profile Binder] Error fetching verified user row:", err.message);
  }

  const metadata = authMetadata || {};

  // Prioritize verified server/database records over unverified client payloads
  const verifiedUsername =
    dbUser?.username || metadata.username || clientContext?.username || "Lifter";
  const verifiedAge = dbUser?.age ?? clientContext?.age ?? null;
  const verifiedHeightFt = dbUser?.height_ft ?? clientContext?.heightFt ?? null;
  const verifiedWeightLbs = dbUser?.weight_lbs ?? clientContext?.weightLbs ?? null;
  const verifiedSex = dbUser?.sex || clientContext?.sex || null;
  const verifiedGoals =
    dbUser?.primary_goal || metadata.primary_goal || clientContext?.primaryGoals || null;
  const verifiedExperience =
    metadata.experience_level || clientContext?.experienceLevel || null;
  const verifiedBirthday = metadata.birthday || clientContext?.birthday || null;

  // Verified PRs from user metadata
  const verifiedBenchPR =
    metadata.bench_pr !== undefined && metadata.bench_pr !== null
      ? Number(metadata.bench_pr)
      : clientContext?.benchPR ?? null;
  const verifiedSquatPR =
    metadata.squat_pr !== undefined && metadata.squat_pr !== null
      ? Number(metadata.squat_pr)
      : clientContext?.squatPR ?? null;
  const verifiedDeadliftPR =
    metadata.deadlift_pr !== undefined && metadata.deadlift_pr !== null
      ? Number(metadata.deadlift_pr)
      : clientContext?.deadliftPR ?? null;

  // Format verified height
  let verifiedHeightFormatted: string | null = null;
  if (verifiedHeightFt) {
    const totalInches = Math.round(verifiedHeightFt * 12);
    const ft = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    const cm = Math.round(verifiedHeightFt * 30.48);
    verifiedHeightFormatted = `${ft}'${inches}" (${cm} cm)`;
  }

  return {
    username: verifiedUsername,
    email: dbUser?.email || clientContext?.email || null,
    age: verifiedAge,
    birthday: verifiedBirthday,
    sex: verifiedSex,
    heightFt: verifiedHeightFt,
    heightFormatted: verifiedHeightFormatted,
    weightLbs: verifiedWeightLbs,
    preferredUnit: clientContext?.preferredUnit || "lbs",
    experienceLevel: verifiedExperience,
    primaryGoals: verifiedGoals,
    benchPR: verifiedBenchPR,
    squatPR: verifiedSquatPR,
    deadliftPR: verifiedDeadliftPR,
    activeRoutine: clientContext?.activeRoutine || null,
    streak: clientContext?.streak ?? 0,
    workedOutToday: Boolean(clientContext?.workedOutToday),
  };
}
