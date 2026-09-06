import NotFoundScreen from "@/app/+not-found";
import { useRoutineStore } from "@/store/routineStore";
import { BlurView } from "expo-blur";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function WorkoutTodo() {
  const { id, routineID } = useLocalSearchParams<{
    id: string;
    routineID: string;
  }>();

  const routine = useRoutineStore((s) =>
    s.routines.find((r) => r.id === routineID),
  );
  const markExerciseDone = useRoutineStore((s) => s.markExerciseDone);
  const updateExerciseDetails = useRoutineStore((s) => s.updateExerciseDetails);
  const fetchRoutineById = useRoutineStore((s) => s.fetchRoutineById);

  const workout = routine?.workouts.find((w) => w.id === id);
  const needsWorkoutExerciseIds = workout?.exercises.some(
    (exercise) => !exercise.workoutExerciseId,
  );

  useEffect(() => {
    if (routineID && (!routine || !workout || needsWorkoutExerciseIds)) {
      void fetchRoutineById(routineID);
    }
  }, [fetchRoutineById, needsWorkoutExerciseIds, routine, routineID, workout]);

  if (!workout && routineID) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#ffd61f" />
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
          headerTitle: "Workout",
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: "#141518" },
          headerShadowVisible: false,
          headerTintColor: "#F5F6F7",
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: "700",
            color: "#F5F6F7",
          },
        }}
      />
      <View style={{ flex: 1, backgroundColor: "#141518" }}>
        <ScrollView style={styles.container}>
          <Text style={styles.title}>{workout.name}</Text>

          <View style={styles.list}>
            {workout.exercises.map((exercise) => (
              <BlurView
                key={exercise.workoutExerciseId ?? exercise.id}
                intensity={40}
                tint="dark"
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
              </BlurView>
            ))}
          </View>
        </ScrollView>
        <View
          style={{ paddingHorizontal: 34, paddingBottom: 20, paddingTop: 20 }}
        >
          <DoneButton routineID={routineID} workoutID={id} />
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
  const [weight, setWeight] = useState(
    exercise.weight === null || exercise.weight === undefined
      ? ""
      : String(exercise.weight),
  );
  const [reps, setReps] = useState(String(exercise.reps));
  const [sets, setSets] = useState(String(exercise.sets));

  const saveWeight = () => {
    const value = weight.trim() === "" ? null : Number(weight);
    if (value !== null && (!Number.isFinite(value) || value < 0)) return;
    void onSave({ weight: value });
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
          onPress={onToggleDone}
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
          <Text style={styles.inputLabel}>Weight</Text>
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
          <Text style={styles.inputUnit}>lb</Text>
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
}: {
  routineID: string;
  workoutID: string;
}) {
  const router = useRouter();
  const markWorkoutDone = useRoutineStore((s) => s.markWorkoutDone);

  return (
    <Pressable
      onPress={async () => {
        const completed = await markWorkoutDone(routineID, workoutID);
        if (completed) router.replace("/workoutPage/workoutPage");
      }}
      style={{
        backgroundColor: "#ffd61f",
        paddingVertical: 20,
        borderRadius: 120,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#141518", fontWeight: "700", fontSize: 16 }}>
        Finish Workout
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141518",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#141518",
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardPressable: { padding: 16 },
  cardCompleted: {
    opacity: 0.7,
    backgroundColor: "#176007",
  },
  exerciseName: {
    flex: 1,
    color: "#ffffff",
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
    backgroundColor: "#ffd61f",
  },
  exerciseDoneText: {
    color: "#141518",
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
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginBottom: 5,
  },
  metricInput: {
    minWidth: 0,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.2)",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  inputUnit: {
    position: "absolute",
    right: 10,
    bottom: 11,
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
  },
});
