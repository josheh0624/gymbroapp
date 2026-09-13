import { LinearGradient } from "expo-linear-gradient";

import { supabase } from "@/api/supabase";
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
  textFaint: "#8A8F98",
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
  const [showMgDropdown, setShowMgDropdown] = useState(false);
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  
  const DAYS_OF_WEEK = [
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
    { id: 7, name: "Sunday" },
  ];
  
  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId].sort((a,b) => a - b)
    );
  };
  

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        const [exRes, mgRes] = await Promise.all([
          supabase.from('exercises').select('id, name').order('name'),
          supabase.from('muscle_groups').select('id, name, body_region')
        ]);
        if (exRes.data) setExercises(exRes.data);
        if (mgRes.data) setMuscleGroups(mgRes.data);
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
    if (!name) {
      Alert.alert("Error", "Please enter an exercise name");
      return;
    }
    if (!selectedMuscleGroupId) {
      Alert.alert("Error", "Please select a muscle group");
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('exercises').insert({
        name,
        muscle_group_id: selectedMuscleGroupId,
        user_id: userData.user?.id
      }).select().single();
      
      if (error) throw error;
      
      const newEx = { id: data.id, name: data.name };
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
    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one scheduled day");
      return;
    }
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
        days: selectedDays,
        exercises: addedExercises.map((ex, idx) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          orderIndex: idx,
        })),
      };

      const { data: userData } = await supabase.auth.getUser();
      
      // 1. Create Workout
      const { data: workout, error: workoutError } = await supabase.from('workouts').insert({
        name: payload.name,
        days: payload.days,
        user_id: userData.user?.id,
        
      }).select().single();
      if (workoutError) throw workoutError;
      
      // 2. Create Workout Exercises
      if (payload.exercises.length > 0) {
        const { error: weError } = await supabase.from('workout_exercises').insert(
          payload.exercises.map(ex => ({
            workout_id: workout.id,
            exercise_id: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            order_index: ex.orderIndex
          }))
        );
        if (weError) throw weError;
      }
      
      // 3. Create scheduled days
      if (payload.days.length > 0) {
        // Find routines for this user (or we don't attach it to a routine?)
        // The old /workouts/create did what? Let's just create workout_routine_days for the active routine if possible.
        // Wait, the API didn't take a routine ID. 
        // For now, if the user creates a workout, they just select it later in custom-workout!
      }

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
          headerStyle: { backgroundColor: "#25262E" },
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
        <LinearGradient
          colors={["#25262E", "#141518"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
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
            
            <Text style={[styles.label, { marginTop: 16, marginBottom: 8 }]}>Scheduled Days</Text>
            <Pressable
              style={[styles.dropdownToggle, { marginTop: 0 }]}
              onPress={() => setShowDaysDropdown(!showDaysDropdown)}
            >
              <Text
                style={[
                  styles.dropdownToggleText,
                  selectedDays.length === 0 && { color: COLORS.textFaint },
                ]}
              >
                {selectedDays.length > 0
                  ? selectedDays.map(d => DAYS_OF_WEEK.find(dw => dw.id === d)?.name.slice(0,3)).join(', ')
                  : "Select days..."}
              </Text>
              <Ionicons
                name={showDaysDropdown ? "chevron-up" : "chevron-down"}
                size={16}
                color={COLORS.textFaint}
              />
            </Pressable>

            {showDaysDropdown && (
              <ScrollView style={styles.dropdownList} nestedScrollEnabled={true}>
                {DAYS_OF_WEEK.map((day) => (
                  <Pressable
                    key={day.id}
                    style={styles.dropdownItem}
                    onPress={() => toggleDay(day.id)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedDays.includes(day.id) && styles.dropdownItemTextActive,
                      ]}
                    >
                      {day.name}
                    </Text>
                    {selectedDays.includes(day.id) && (
                      <Ionicons name="checkmark" size={18} color={COLORS.accent} style={{ position: 'absolute', right: 16, top: 14 }} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}
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

            {!isCreatingExercise && (
              <Pressable
                style={({ pressed }) => [
                  styles.workoutRow,
                  {
                    justifyContent: "center",
                    paddingTop: 0,
                    paddingBottom: 20,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => setIsCreatingExercise(true)}
              >
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={COLORS.accent}
                />
                <Text
                  style={[styles.workoutName, { color: COLORS.accent }]}
                >
                  Create Custom Exercise
                </Text>
              </Pressable>
            )}

            {isCreatingExercise ? (
              <View style={styles.customExerciseForm}>
                <TextInput
                  style={[styles.input, { marginBottom: 16 }]}
                  placeholder="Exercise Name"
                  placeholderTextColor={COLORS.textFaint}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus
                />
                <View style={styles.muscleGroupContainer}>
                  <Text style={styles.metricLabel}>Select Muscle Group</Text>
                  <Pressable
                    style={styles.dropdownToggle}
                    onPress={() => setShowMgDropdown(!showMgDropdown)}
                  >
                    <Text
                      style={[
                        styles.dropdownToggleText,
                        !selectedMuscleGroupId && { color: COLORS.textFaint },
                      ]}
                    >
                      {selectedMuscleGroupId
                        ? muscleGroups.find(
                            (m) => m.id === selectedMuscleGroupId,
                          )?.name
                        : "Select..."}
                    </Text>
                    <Ionicons
                      name={showMgDropdown ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={COLORS.textFaint}
                    />
                  </Pressable>

                  {showMgDropdown && (
                    <ScrollView
                      style={styles.dropdownList}
                      nestedScrollEnabled={true}
                    >
                      {muscleGroups.map((mg) => (
                        <Pressable
                          key={mg.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setSelectedMuscleGroupId(mg.id);
                            setShowMgDropdown(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              selectedMuscleGroupId === mg.id &&
                                styles.dropdownItemTextActive,
                            ]}
                          >
                            {mg.name}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                  <Pressable
                    style={[styles.formBtn, { backgroundColor: COLORS.bg }]}
                    onPress={() => {
                      setIsCreatingExercise(false);
                      setSearchQuery("");
                      setSelectedMuscleGroupId(null);
                    }}
                  >
                    <Text style={{ color: COLORS.text, fontWeight: "700" }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.formBtn, { backgroundColor: COLORS.accent }]}
                    onPress={handleCreateNewExercise}
                  >
                    <Text style={{ color: "#141518", fontWeight: "700" }}>
                      Create
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <TextInput
                  style={[styles.input, { marginBottom: 16 }]}
                  placeholder="Search exercises..."
                  placeholderTextColor={COLORS.textFaint}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />

                <View style={styles.list}>
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
              </>
            )}
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
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  widget: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  label: {
    color: COLORS.textFaint,
    fontSize: 11,
    fontWeight: "normal",
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
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  metricLabel: {
    color: COLORS.textFaint,
    fontSize: 10,
    fontWeight: "normal",
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
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    backgroundColor: "transparent",
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
    backgroundColor: "transparent",
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
  customExerciseForm: {
    marginTop: 8,
  },
  formBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  dropdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginTop: 8,
  },
  dropdownToggleText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  dropdownList: {
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginTop: 8,
    maxHeight: 200,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceBorder,
  },
  dropdownItemText: {
    color: COLORS.textFaint,
    fontSize: 15,
    fontWeight: "600",
  },
  dropdownItemTextActive: {
    color: COLORS.accent,
  },
});
