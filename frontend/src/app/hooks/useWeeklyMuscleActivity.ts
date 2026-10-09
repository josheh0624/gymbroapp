import { supabase } from "@/api/supabase";
import dayjs, { type Dayjs } from "dayjs";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export type MuscleSide = "front" | "back";

export type WeeklyMuscleHit = {
  muscleGroupName: string;
  timesHit: number;
};

export type DailyActivity = {
  date: string;
  trained: boolean;
  workoutCount: number;
  isRestDay?: boolean;
};

export type WeeklyStats = {
  totalWorkouts: number;
  totalSets: number;
  totalExercises: number;
  daysTrained: number;
  currentStreak?: number;
  totalVolume?: number;
  personalRecords?: number;
};

export type WeeklySummaryResponse = {
  muscleHits: WeeklyMuscleHit[];
  stats: WeeklyStats;
  dailyActivity: DailyActivity[];
};

export function getWeekBounds(weekOffset: number) {
  const anchor = dayjs().add(weekOffset, "week");
  const dow = anchor.day();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const start = anchor.add(diffToMonday, "day").startOf("day");
  const end = start.add(6, "day").endOf("day");
  return { start, end };
}

export function formatWeekRange(start: Dayjs, end: Dayjs) {
  const sameMonth = start.month() === end.month();
  return `${start.format("MMM D")} – ${end.format(sameMonth ? "D" : "MMM D")}`;
}

export function keepsStreak(day: DailyActivity) {
  return day.trained || Boolean(day.isRestDay);
}

export function computeLongestStreak(days: DailyActivity[]) {
  let longest = 0;
  let current = 0;

  for (const day of days) {
    if (keepsStreak(day)) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }

  return longest;
}

export function computeTrailingStreak(days: DailyActivity[]) {
  let streak = 0;

  for (let i = days.length - 1; i >= 0; i -= 1) {
    const day = days[i];
    if (dayjs(day.date).isAfter(dayjs(), "day")) continue;

    if (keepsStreak(day)) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Custom hook to fetch and aggregate weekly muscle activity and training volume.
 */
export function useWeeklyMuscleHits(weekOffset: number) {
  const [data, setData] = useState<WeeklyMuscleHit[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [prevStats, setPrevStats] = useState<WeeklyStats | null>(null);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [monthlyStats, setMonthlyStats] = useState<WeeklyStats[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<DailyActivity[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { start, end } = getWeekBounds(weekOffset);
      const { start: prevStart, end: prevEnd } = getWeekBounds(weekOffset - 1);
      const { start: w2Start, end: w2End } = getWeekBounds(weekOffset - 2);
      const { start: w3Start, end: w3End } = getWeekBounds(weekOffset - 3);

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const [currRes, prevRes, w2Res, w3Res] = await Promise.all([
        supabase.rpc("get_muscle_summary", {
          p_user_id: userId,
          p_start_date: start.format("YYYY-MM-DD"),
          p_end_date: end.format("YYYY-MM-DD"),
        }),
        supabase.rpc("get_muscle_summary", {
          p_user_id: userId,
          p_start_date: prevStart.format("YYYY-MM-DD"),
          p_end_date: prevEnd.format("YYYY-MM-DD"),
        }),
        supabase.rpc("get_muscle_summary", {
          p_user_id: userId,
          p_start_date: w2Start.format("YYYY-MM-DD"),
          p_end_date: w2End.format("YYYY-MM-DD"),
        }),
        supabase.rpc("get_muscle_summary", {
          p_user_id: userId,
          p_start_date: w3Start.format("YYYY-MM-DD"),
          p_end_date: w3End.format("YYYY-MM-DD"),
        }),
      ]);

      if (currRes.error) throw currRes.error;

      setData(currRes.data.muscleHits ?? []);
      setStats(currRes.data.stats ?? null);
      setDailyActivity(currRes.data.dailyActivity ?? []);

      if (!prevRes.error && prevRes.data?.stats)
        setPrevStats(prevRes.data.stats);
      else setPrevStats(null);

      const mStats = [
        w3Res.data?.stats ?? { daysTrained: 0 },
        w2Res.data?.stats ?? { daysTrained: 0 },
        prevRes.data?.stats ?? { daysTrained: 0 },
        currRes.data?.stats ?? { daysTrained: 0 },
      ] as WeeklyStats[];

      const mActivity = [
        ...(w3Res.data?.dailyActivity ?? []),
        ...(w2Res.data?.dailyActivity ?? []),
        ...(prevRes.data?.dailyActivity ?? []),
        ...(currRes.data?.dailyActivity ?? []),
      ] as DailyActivity[];

      setMonthlyStats(mStats);
      setMonthlyActivity(mActivity);
    } catch (err: any) {
      console.error("RPC Error:", err);
      setError(
        err instanceof Error ? err.message : "Couldn't load this week's data",
      );
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  return {
    data,
    stats,
    prevStats,
    monthlyStats,
    monthlyActivity,
    dailyActivity,
    loading,
    error,
    refetch: fetchData,
  };
}
