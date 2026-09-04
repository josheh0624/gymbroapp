import NotFoundScreen from "@/app/+not-found";
import { useRoutineStore } from "@/store/routineStore";
import { BlurView } from "expo-blur";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function WorkoutTodo() {
  const { id, routineID } = useLocalSearchParams<{
    id: string;
    routineID: string;
  }>();

  const routine = useRoutineStore((s) =>
    s.routines.find((r) => r.id === routineID),
  );
  const markExerciseDone = useRoutineStore((s) => s.markExerciseDone);
  const fetchRoutineById = useRoutineStore((s) => s.fetchRoutineById);

  const workout = routine?.workouts.find((w) => w.id === id);
  const needsWorkoutExerciseIds = workout?.exercises.some(
    (exercise) => !exercise.workoutExerciseId,
  );

  useEffect(() => {
    if (routineID && needsWorkoutExerciseIds) {
      void fetchRoutineById(routineID);
    }
  }, [fetchRoutineById, routineID, needsWorkoutExerciseIds]);

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
                <Pressable
                  style={[
                    styles.cardPressable,
                    exercise.isDone && {
                      opacity: 0.7,
                      backgroundColor: "#176007",
                    },
                  ]}
                  onPress={() =>
                    markExerciseDone(
                      routineID,
                      workout.id,
                      exercise.workoutExerciseId,
                      exercise.id,
                      !exercise.isDone,
                    )
                  }
                >
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDetail}>
                    {exercise.sets} sets x {exercise.reps} reps
                  </Text>
                </Pressable>
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
  exerciseName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  exerciseDetail: { color: "#ffd61f", fontSize: 14, fontWeight: "500" },
});
