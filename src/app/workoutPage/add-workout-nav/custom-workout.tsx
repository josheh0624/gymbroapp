import { supabase } from "@/api/supabase";
import { useRoutineStore } from "@/store/routineStore";
import { COLORS } from "@/styles/appStyles";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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
import { useFocusEffect } from "expo-router";

type AvailableWorkout = { id: string; name: string; days?: number[]; user_id?: string | null };

export default function CustomWorkout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [routineName, setRoutineName] = useState("");
  const [workouts, setWorkouts] = useState<AvailableWorkout[]>([]);
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<Set<string>>(
    new Set(),
  );
  const [workoutDays, setWorkoutDays] = useState<Record<string, number[]>>({});
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(true);
  const [isInitializingEdit, setIsInitializingEdit] = useState(!!id);

  const createRoutine = useRoutineStore((s) => s.createRoutine);
  const updateRoutine = useRoutineStore((s) => s.updateRoutine);
  const fetchRoutineById = useRoutineStore((s) => s.fetchRoutineById);
  const routines = useRoutineStore((s) => s.routines);
  const isCreating = useRoutineStore((s) => s.isLoading);

  useFocusEffect(
    useCallback(() => {
      async function fetchWorkouts() {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (!userData.user) return;
          const { data, error } = await supabase
            .from('workouts')
            .select('id, name, days, user_id')
            .or(`user_id.eq.${userData.user.id},user_id.is.null`)
            .order('name');
          if (error) throw error;
          
          setWorkouts(data as AvailableWorkout[]);
          const wDays: Record<string, number[]> = {};
          (data as AvailableWorkout[]).forEach((w) => { wDays[w.id] = w.days || []; });
          setWorkoutDays(wDays);
        } catch (err) {
          console.error("Failed to fetch workouts", err);
        } finally {
          setIsLoadingWorkouts(false);
        }
      }
      fetchWorkouts();
    }, []),
  );

  useEffect(() => {
    if (id) {
      const initializeEdit = async () => {
        await fetchRoutineById(id);
        setIsInitializingEdit(false);
      };
      initializeEdit();
    }
  }, [id]);

  useEffect(() => {
    if (id && !isInitializingEdit) {
      const routine = routines.find((r) => r.id === id);
      if (routine) {
        setRoutineName(routine.name);
        setSelectedWorkoutIds(new Set(routine.workouts.map((w) => w.id)));
      }
    }
  }, [id, isInitializingEdit, routines]);

  const toggleWorkoutDay = (w_id: string, day: number) => {
    setWorkoutDays(prev => {
      const current = prev[w_id] || [];
      const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day].sort((a,b) => a-b);
      return { ...prev, [w_id]: next };
    });
  };

  const toggleWorkout = (w_id: string) => {
    const next = new Set(selectedWorkoutIds);
    if (next.has(w_id)) {
      next.delete(w_id);
    } else {
      next.add(w_id);
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

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        for (const wId of Array.from(selectedWorkoutIds)) {
          const w = workouts.find(x => x.id === wId);
          if (w && w.user_id !== null) {
            await supabase.from('workouts').update({ days: workoutDays[wId] || [] }).eq('id', wId);
          }
        }
      }
    } catch(err) {
      console.error(err);
    }

    if (id) {
      const success = await updateRoutine(
        id,
        routineName.trim(),
        Array.from(selectedWorkoutIds),
      );
      if (success) router.back();
    } else {
      const newId = await createRoutine(
        routineName.trim(),
        Array.from(selectedWorkoutIds),
      );
      if (newId) router.back();
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: id ? "Edit Routine" : "Create Routine",
          headerBackButtonDisplayMode: "minimal",
          headerStyle: {
            backgroundColor: COLORS.bg,
          },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: "800",
            color: COLORS.text,
          },
        }}
      />

      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.widget}>
            <Text style={styles.label}>Routine Name</Text>
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
            <Text style={styles.label}>Select Workouts</Text>

            {isLoadingWorkouts ? (
              <ActivityIndicator
                color={COLORS.accent}
                style={{ marginTop: 20, marginBottom: 10 }}
              />
            ) : (
              <View style={styles.list}>
                {workouts.length === 0 ? (
                  <Text style={[styles.emptyText, { paddingVertical: 14 }]}>
                    No available workouts found.
                  </Text>
                ) : (
                  workouts.map((workout, index) => {
                    const isSelected = selectedWorkoutIds.has(workout.id);
                    return (
                      <View key={workout.id} style={styles.rowDivider}>
                        <Pressable
                          onPress={() => toggleWorkout(workout.id)}
                          style={[styles.workoutRow]}
                        >
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <Ionicons name="checkmark" size={16} color="#141518" />}
                          </View>
                          <Text style={styles.workoutName}>{workout.name}</Text>
                        </Pressable>
                        
                        {isSelected && (
                          <View style={{ paddingLeft: 40, paddingBottom: 16, flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                            {workout.user_id === null ? (
                              <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>Prebuilt workouts have fixed days.</Text>
                            ) : (
                              [1,2,3,4,5,6,7].map(day => {
                                const dayNames = ["M","T","W","T","F","S","S"];
                                const isDaySelected = (workoutDays[workout.id] || []).includes(day);
                                return (
                                  <Pressable
                                    key={day}
                                    onPress={() => toggleWorkoutDay(workout.id, day)}
                                    style={{
                                      width: 32, height: 32, borderRadius: 16, 
                                      backgroundColor: isDaySelected ? COLORS.accent : 'rgba(255,255,255,0.05)',
                                      alignItems: 'center', justifyContent: 'center',
                                      borderWidth: 1, borderColor: isDaySelected ? COLORS.accent : 'rgba(255,255,255,0.1)'
                                    }}
                                  >
                                    <Text style={{ color: isDaySelected ? '#141518' : COLORS.textMuted, fontWeight: '700', fontSize: 13 }}>
                                      {dayNames[day-1]}
                                    </Text>
                                  </Pressable>
                                );
                              })
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })
                )}

                <Pressable
                  style={({ pressed }) => [
                    styles.workoutRow,
                    {
                      justifyContent: "center",
                      paddingTop: 20,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                  onPress={() =>
                    router.push("/workoutPage/add-workout-nav/create-workout")
                  }
                >
                  <Ionicons name="add-circle" size={20} color={COLORS.accent} />
                  <Text style={[styles.workoutName, { color: COLORS.accent }]}>
                    Create Custom Workout
                  </Text>
                </Pressable>
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
    backgroundColor: COLORS.surface,
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
