import { useThemeStore } from "@/store/themeStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useMemo } from "react";
import { COLORS, useThemeColors, ThemeColors } from "@/styles/appStyles";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

import NotFoundScreen from "@/app/+not-found";
import { useRoutineStore } from "@/store/routineStore";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function WorkoutTodo() {
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const { weightUnit } = useSettingsStore();
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);



  const { id, routineID, selectedDateString } = useLocalSearchParams<{
    id: string;
    routineID: string;
    selectedDateString?: string;
  }>();

  const routine = useRoutineStore((s) =>
    s.routines.find((r) => r.id === routineID),
  );
  const markExerciseDone = useRoutineStore((s) => s.markExerciseDone);
  const updateExerciseDetails = useRoutineStore((s) => s.updateExerciseDetails);
  const syncWorkoutProgress = useRoutineStore((s) => s.syncWorkoutProgress);
  const fetchRoutineById = useRoutineStore((s) => s.fetchRoutineById);
  const resetKey = useRef<string | null>(null);

  const activeSession = useRoutineStore((s) => s.activeSession);
  const startSession = useRoutineStore((s) => s.startSession);
  const router = useRouter();
  const endSession = useRoutineStore((s) => s.endSession);

  const workout = routine?.workouts.find((w) => w.id === id);

  useEffect(() => {
    if (routineID && id && selectedDateString) {
      startSession(routineID, id, selectedDateString);
    }
  }, [routineID, id, selectedDateString, startSession]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeSession || activeSession.workoutId !== id) return;
    
    // Initial sync
    setElapsedSeconds(Math.floor((Date.now() - activeSession.startTime) / 1000));
    
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - activeSession.startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [activeSession, id]);

  const formattedTime = useMemo(() => {
    const hrs = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);
  const needsWorkoutExerciseIds = workout?.exercises.some(
    (exercise) => !exercise.workoutExerciseId,
  );

  useEffect(() => {
    if (routineID && (!routine || !workout || needsWorkoutExerciseIds)) {
      void fetchRoutineById(routineID);
    }
  }, [fetchRoutineById, needsWorkoutExerciseIds, routine, routineID, workout]);

  useEffect(() => {
    if (
      !routineID ||
      !workout ||
      needsWorkoutExerciseIds ||
      !selectedDateString ||
      resetKey.current === `${routineID}:${id}:${selectedDateString}`
    ) {
      return;
    }

    resetKey.current = `${routineID}:${id}:${selectedDateString}`;
    syncWorkoutProgress(routineID, workout.id, selectedDateString);
  }, [id, needsWorkoutExerciseIds, syncWorkoutProgress, routineID, workout, selectedDateString]);

  if (!workout && routineID) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#4169E1" />
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  if (!workout)
    return (
      <View style={styles.container}>
        <NotFoundScreen />
      </View>
    );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: `Workout - ${formattedTime}`,
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: colors.gradientTop },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: "700",
            color: colors.text,
          },
        }}
      />
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={[colors.gradientTop, colors.bg]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <ScrollView style={styles.container}>
          <Text style={styles.title}>{workout.name}</Text>

          <View style={styles.list}>
            {workout.exercises.map((exercise) => (
              <View
                key={exercise.workoutExerciseId ?? exercise.id}
                style={styles.card}
              >
                <ExerciseCard
                  exercise={exercise}
                  onToggleDone={() =>
                    markExerciseDone(
                      routineID,
                      workout.id,
                      exercise.workoutExerciseId,
                      exercise.id,
                      !exercise.isDone,
                      selectedDateString
                    )
                  }
                  onSave={(updates) => {
                    if (!exercise.workoutExerciseId) return;
                    return updateExerciseDetails(
                      routineID,
                      workout.id,
                      exercise.workoutExerciseId,
                      updates,
                    );
                  }}
                />
              </View>
            ))}
          </View>
        </ScrollView>
        <View
          style={{ paddingHorizontal: 34, paddingBottom: 40, paddingTop: 20, gap: 12 }}
        >
          <DoneButton routineID={routineID} workoutID={id} selectedDateString={selectedDateString} durationSeconds={elapsedSeconds} />
          
          <Pressable
            onPress={() => {
              Alert.alert(
                "Stop Workout",
                "Are you sure you want to stop? This will end the active timer without finishing the workout.",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Stop Workout", 
                    style: "destructive", 
                    onPress: () => {
                      endSession();
                      router.back();
                    }
                  }
                ]
              );
            }}
            style={{
              backgroundColor: "transparent",
              paddingVertical: 18,
              borderRadius: 120,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.coral,
            }}
          >
            <Text style={{ color: colors.coral, fontWeight: "700", fontSize: 16 }}>
              Stop Workout
            </Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

function ExerciseCard({

  exercise,
  onToggleDone,
  onSave,
}: {
  exercise: {
    name: string;
    sets: number;
    reps: number;
    weight?: number | null;
    isDone?: boolean;
    workoutExerciseId?: string;
  };
  onToggleDone: () => void;
  onSave: (updates: {
    weight?: number | null;
    reps?: number;
    sets?: number;
  }) => Promise<void> | void;
}) {
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const { weightUnit } = useSettingsStore();
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);
  const [weight, setWeight] = useState(
    exercise.weight === null || exercise.weight === undefined
      ? ""
      : weightUnit === "kgs" ? String(Number((exercise.weight * 0.453592).toFixed(1))) : String(exercise.weight),
  );
  const [reps, setReps] = useState(String(exercise.reps));
  const [sets, setSets] = useState(String(exercise.sets));

  const saveWeight = () => {
    const parsedValue = weight.trim() === "" ? null : Number(weight);
    if (parsedValue !== null && (!Number.isFinite(parsedValue) || parsedValue < 0)) return;
    
    // Convert back to lbs for storage if user is typing in kgs
    const valueToSave = parsedValue === null ? null : (weightUnit === "kgs" ? Number((parsedValue / 0.453592).toFixed(1)) : parsedValue);
    
    void onSave({ weight: valueToSave });
    Keyboard.dismiss();
  };

  const saveReps = () => {
    const value = Number(reps);
    if (!Number.isInteger(value) || value <= 0) return;
    void onSave({ reps: value });
    Keyboard.dismiss();
  };

  const saveSets = () => {
    const value = Number(sets);
    if (!Number.isInteger(value) || value <= 0) return;
    void onSave({ sets: value });
    Keyboard.dismiss();
  };

  return (
    <View
      style={[styles.cardPressable, exercise.isDone && styles.cardCompleted]}
    >
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Pressable
          onPress={() => {
            saveWeight();
            saveReps();
            saveSets();
            onToggleDone();
          }}
          style={styles.exerciseDoneButton}
          hitSlop={6}
        >
          <Text style={styles.exerciseDoneText}>
            {exercise.isDone ? "Undo" : "Done"}
          </Text>
        </Pressable>
      </View>
      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Sets</Text>
          <TextInput
            value={sets}
            onChangeText={setSets}
            onBlur={saveSets}
            onSubmitEditing={saveSets}
            keyboardType="number-pad"
            returnKeyType="done"
            selectTextOnFocus
            style={styles.metricInput}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Weight ({weightUnit})</Text>
          <TextInput
            value={weight}
            onChangeText={setWeight}
            onBlur={saveWeight}
            onSubmitEditing={saveWeight}
            placeholder="0"
            placeholderTextColor="#777B82"
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectTextOnFocus
            style={styles.metricInput}
          />
          <Text style={styles.inputUnit}>{weightUnit === "kgs" ? "kg" : "lb"}</Text>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Reps</Text>
          <TextInput
            value={reps}
            onChangeText={setReps}
            onBlur={saveReps}
            onSubmitEditing={saveReps}
            keyboardType="number-pad"
            returnKeyType="done"
            selectTextOnFocus
            style={styles.metricInput}
          />
        </View>
      </View>
    </View>
  );
}

function DoneButton({
  routineID,
  workoutID,
  selectedDateString,
  durationSeconds,
}: {
  routineID: string;
  workoutID: string;
  selectedDateString?: string;
  durationSeconds?: number;
}) {
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const { weightUnit } = useSettingsStore();
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  const router = useRouter();
  const markWorkoutDone = useRoutineStore((s) => s.markWorkoutDone);

  return (
    <Pressable
      onPress={async () => {
        const completed = await markWorkoutDone(routineID, workoutID, selectedDateString, durationSeconds);
        if (completed) router.back();
      }}
      style={{
        backgroundColor: "#4169E1",
        paddingVertical: 20,
        borderRadius: 120,
        alignItems: "center",
      }}
    >
      <Text style={{ color: isLight ? "#141518" : colors.bg, fontWeight: "700", fontSize: 16 }}>
        Finish Workout
      </Text>
    </Pressable>
  );
}

const getStyles = (colors: ThemeColors, isLight: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.bg,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
  },
  list: { gap: 12 },
  card: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.glassStrong,
    borderWidth: 1,
    borderColor: colors.glassStrongBorder,
  },
  cardPressable: { padding: 20 },
  cardCompleted: {
    opacity: 0.8,
    backgroundColor: "#1D3A20", // slightly greener but muted for dark mode
  },
  exerciseName: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  exerciseDoneButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#4169E1",
  },
  exerciseDoneText: {
    color: isLight ? "#141518" : colors.bg,
    fontSize: 12,
    fontWeight: "800",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  inputGroup: { flex: 1 },
  inputLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 5,
  },
  metricInput: {
    minWidth: 0,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.glassStrongBorder,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  inputUnit: {
    position: "absolute",
    right: 10,
    bottom: 11,
    color: colors.textMuted,
    fontSize: 11,
  },
});
