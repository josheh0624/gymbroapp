import { api } from "@/api/api";
import { useRoutineStore } from "@/store/routineStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  bg: "#111214",
  text: "#F5F6F7",
  textFaint: "#565A60",
  textMuted: "rgba(255,255,255,0.5)",
  accent: "#ffd61f",
  widgetBg: "#1C1D22",
  surfaceBorder: "rgba(255,255,255,0.09)",
};

interface AvailableWorkout {
  id: string;
  name: string;
}

export default function CustomWorkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [routineName, setRoutineName] = useState("");
  const [workouts, setWorkouts] = useState<AvailableWorkout[]>([]);
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(true);

  const createRoutine = useRoutineStore((s) => s.createRoutine);
  const isCreating = useRoutineStore((s) => s.isLoading);

  useFocusEffect(
    useCallback(() => {
      async function fetchWorkouts() {
        try {
          const res = await api.get<AvailableWorkout[]>("/workouts/getAll");
          setWorkouts(res.data);
        } catch (err) {
          console.error("Failed to fetch workouts", err);
        } finally {
          setIsLoadingWorkouts(false);
        }
      }
      fetchWorkouts();
    }, []),
  );

  const toggleWorkout = (id: string) => {
    const next = new Set(selectedWorkoutIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedWorkoutIds(next);
  };

  const handleCreate = async () => {
    if (!routineName.trim()) {
      Alert.alert("Error", "Please enter a routine name");
      return;
    }
    if (selectedWorkoutIds.size === 0) {
      Alert.alert("Error", "Please select at least one workout");
      return;
    }

    const newId = await createRoutine(
      routineName.trim(),
      Array.from(selectedWorkoutIds),
    );
    if (newId) {
      router.back();
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Create Routine",
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: COLORS.bg },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: "700",
            color: COLORS.text,
          },
        }}
      />

      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.widget}>
            <Text style={styles.label}>ROUTINE NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bro Split"
              placeholderTextColor={COLORS.textFaint}
              value={routineName}
              onChangeText={setRoutineName}
              autoFocus
              returnKeyType="done"
            />
          </View>

          <View style={styles.widget}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={[styles.label, { marginBottom: 0 }]}>
                SELECT WORKOUTS
              </Text>
              <Pressable
                onPress={() =>
                  router.push("/workoutPage/add-workout-nav/create-workout")
                }
                hitSlop={8}
              >
                <Text
                  style={{
                    color: COLORS.accent,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  + Create New
                </Text>
              </Pressable>
            </View>

            {isLoadingWorkouts ? (
              <ActivityIndicator
                color={COLORS.accent}
                style={{ marginTop: 20, marginBottom: 10 }}
              />
            ) : workouts.length === 0 ? (
              <Text style={styles.emptyText}>
                No available workouts found. Create one above!
              </Text>
            ) : (
              <View style={styles.list}>
                {workouts.map((workout, index) => {
                  const isSelected = selectedWorkoutIds.has(workout.id);
                  return (
                    <Pressable
                      key={workout.id}
                      onPress={() => toggleWorkout(workout.id)}
                      style={[
                        styles.workoutRow,
                        index !== workouts.length - 1 && styles.rowDivider,
                      ]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#141518"
                          />
                        )}
                      </View>
                      <Text style={styles.workoutName}>{workout.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.pressedButton,
              isCreating && { opacity: 0.7 },
            ]}
            onPress={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#141518" />
            ) : (
              <Text style={styles.createButtonText}>Save Routine</Text>
            )}
          </Pressable>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  widget: {
    backgroundColor: COLORS.widgetBg,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  label: {
    color: COLORS.textFaint,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 16,
  },
  input: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    paddingBottom: 8,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  list: {
    marginTop: -8,
  },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 16,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceBorder,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.textFaint,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  workoutName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: "#25262E",
    backgroundColor: COLORS.bg,
  },
  createButton: {
    backgroundColor: COLORS.accent,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  pressedButton: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
  createButtonText: {
    color: "#141518",
    fontSize: 16,
    fontWeight: "800",
  },
});
