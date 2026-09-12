import { api } from "@/api/api";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

interface AvailableExercise {
  id: string;
  name: string;
  muscle_group_name?: string;
}

interface MuscleGroup {
  id: number;
  name: string;
  body_region: string;
}

interface WorkoutExerciseInput {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export default function CreateWorkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<AvailableExercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [addedExercises, setAddedExercises] = useState<WorkoutExerciseInput[]>(
    [],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<
    number | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [exRes, mgRes] = await Promise.all([
          api.get<AvailableExercise[]>("/exercises/getAll"),
          api.get<MuscleGroup[]>("/exercises/muscleGroups").catch(() => ({
            data: [],
          })),
        ]);
        setExercises(exRes.data);
        if (mgRes?.data) setMuscleGroups(mgRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    }
    fetchData();
  }, []);

  const handleAddExercise = (ex: AvailableExercise) => {
    setAddedExercises((prev) => [
      ...prev,
      { exerciseId: ex.id, name: ex.name, sets: 3, reps: 10, weight: 0 },
    ]);
    setSearchQuery("");
    setIsCreatingExercise(false);
    setSelectedMuscleGroupId(null);
  };

  const handleCreateNewExercise = async () => {
    const name = searchQuery.trim();
    if (!name) return;

    if (!isCreatingExercise) {
      setIsCreatingExercise(true);
      return;
    }

    try {
      const res = await api.post("/exercises/create", {
        name,
        muscleGroupId: selectedMuscleGroupId,
      });
      const newEx = { id: res.data.id, name: res.data.name };
      setExercises((prev) => [...prev, newEx]);
      handleAddExercise(newEx);
    } catch (err) {
      console.error("Failed to create exercise", err);
      Alert.alert("Error", "Could not create exercise");
    }
  };

  const updateAddedExercise = (
    index: number,
    field: keyof WorkoutExerciseInput,
    value: string,
  ) => {
    const parsed = parseInt(value, 10);
    const num = isNaN(parsed) ? 0 : parsed;
    setAddedExercises((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: num };
      return next;
    });
  };

  const removeExercise = (index: number) => {
    setAddedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert("Error", "Please enter a workout name");
      return;
    }
    if (addedExercises.length === 0) {
      Alert.alert("Error", "Please add at least one exercise");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: workoutName.trim(),
        days: [],
        exercises: addedExercises.map((ex, idx) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          orderIndex: idx,
        })),
      };

      await api.post("/workouts/create", payload);

      // Navigate back to the caller
      router.back();
    } catch (err) {
      console.error("Failed to create workout", err);
      Alert.alert("Error", "Could not create workout");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const showCreateOption =
    searchQuery.trim().length > 0 &&
    !exercises.some(
      (ex) => ex.name.toLowerCase() === searchQuery.trim().toLowerCase(),
    );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "New Workout",
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.widget}>
            <Text style={styles.label}>Workout Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Push Day"
              placeholderTextColor={COLORS.textFaint}
              value={workoutName}
              onChangeText={setWorkoutName}
              returnKeyType="done"
            />
          </View>

          {addedExercises.length > 0 && (
            <View style={styles.widget}>
              <Text style={styles.label}>Exercises</Text>
              <View style={styles.list}>
                {addedExercises.map((ex, index) => (
                  <View
                    key={`${ex.exerciseId}-${index}`}
                    style={[
                      styles.addedExerciseCard,
                      index !== addedExercises.length - 1 && styles.rowDivider,
                    ]}
                  >
                    <View style={styles.addedExerciseHeader}>
                      <Text style={styles.workoutName}>{ex.name}</Text>
                      <Pressable
                        onPress={() => removeExercise(index)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#FF453A"
                        />
                      </Pressable>
                    </View>
                    <View style={styles.metricsRow}>
                      <View style={styles.metricInputGroup}>
                        <Text style={styles.metricLabel}>Sets</Text>
                        <TextInput
                          style={styles.metricInput}
                          keyboardType="numeric"
                          value={ex.sets ? String(ex.sets) : ""}
                          onChangeText={(val) =>
                            updateAddedExercise(index, "sets", val)
                          }
                        />
                      </View>
                      <View style={styles.metricInputGroup}>
                        <Text style={styles.metricLabel}>Reps</Text>
                        <TextInput
                          style={styles.metricInput}
                          keyboardType="numeric"
                          value={ex.reps ? String(ex.reps) : ""}
                          onChangeText={(val) =>
                            updateAddedExercise(index, "reps", val)
                          }
                        />
                      </View>
                      <View style={styles.metricInputGroup}>
                        <Text style={styles.metricLabel}>Weight</Text>
                        <TextInput
                          style={styles.metricInput}
                          keyboardType="numeric"
                          value={ex.weight ? String(ex.weight) : ""}
                          onChangeText={(val) =>
                            updateAddedExercise(index, "weight", val)
                          }
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.widget}>
            <Text style={styles.label}>Add Exercise</Text>
            <TextInput
              style={[styles.input, { marginBottom: 16 }]}
              placeholder="Search or create new..."
              placeholderTextColor={COLORS.textFaint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />

            <View style={styles.list}>
              {showCreateOption && (
                <View>
                  <Pressable
                    style={styles.workoutRow}
                    onPress={handleCreateNewExercise}
                  >
                    <Ionicons
                      name={
                        isCreatingExercise ? "checkmark-circle" : "add-circle"
                      }
                      size={20}
                      color={COLORS.accent}
                    />
                    <Text
                      style={[styles.workoutName, { color: COLORS.accent }]}
                    >
                      {isCreatingExercise
                        ? `Save "${searchQuery.trim()}"`
                        : `Create "${searchQuery.trim()}"`}
                    </Text>
                  </Pressable>

                  {isCreatingExercise && (
                    <View style={styles.muscleGroupContainer}>
                      <Text style={styles.metricLabel}>
                        Select Muscle Group (optional)
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.mgScroll}
                      >
                        {muscleGroups.map((mg) => (
                          <Pressable
                            key={mg.id}
                            style={[
                              styles.mgPill,
                              selectedMuscleGroupId === mg.id &&
                                styles.mgPillActive,
                            ]}
                            onPress={() =>
                              setSelectedMuscleGroupId(
                                mg.id === selectedMuscleGroupId ? null : mg.id,
                              )
                            }
                          >
                            <Text
                              style={[
                                styles.mgText,
                                selectedMuscleGroupId === mg.id &&
                                  styles.mgTextActive,
                              ]}
                            >
                              {mg.name}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}
              {filteredExercises.slice(0, 10).map((ex, index) => (
                <Pressable
                  key={ex.id}
                  style={[
                    styles.workoutRow,
                    index !== Math.min(filteredExercises.length, 10) - 1 &&
                      styles.rowDivider,
                  ]}
                  onPress={() => handleAddExercise(ex)}
                >
                  <Ionicons name="add" size={20} color={COLORS.textFaint} />
                  <Text style={styles.workoutName}>{ex.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.pressedButton,
              isSaving && { opacity: 0.7 },
            ]}
            onPress={handleSaveWorkout}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#141518" />
            ) : (
              <Text style={styles.createButtonText}>Create Workout</Text>
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
  list: {
    marginTop: -8,
  },
  workoutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceBorder,
  },
  workoutName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  addedExerciseCard: {
    paddingVertical: 16,
  },
  addedExerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricInputGroup: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  metricLabel: {
    color: COLORS.textFaint,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
  },
  metricInput: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    width: "100%",
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
  muscleGroupContainer: {
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceBorder,
  },
  mgScroll: {
    gap: 8,
    paddingTop: 8,
  },
  mgPill: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  mgPillActive: {
    backgroundColor: "rgba(255,214,31,0.12)",
    borderColor: COLORS.accent,
  },
  mgText: {
    color: COLORS.textFaint,
    fontSize: 13,
    fontWeight: "700",
  },
  mgTextActive: {
    color: COLORS.accent,
  },
});
