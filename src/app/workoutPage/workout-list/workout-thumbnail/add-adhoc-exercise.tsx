import { useThemeStore } from "@/store/themeStore";
import { useMemo, useState, useEffect } from "react";
import { useThemeColors } from "@/styles/appStyles";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/api/supabase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoutineStore } from "@/store/routineStore";

interface AvailableExercise {
  id: string;
  name: string;
  muscle_group_name?: string;
}

export default function AddAdhocExercise() {
  const { routineId, workoutId } = useLocalSearchParams<{ routineId: string; workoutId: string }>();
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addAdHocExerciseToActiveWorkout = useRoutineStore(s => s.addAdHocExerciseToActiveWorkout);

  const [searchQuery, setSearchQuery] = useState("");
  const [exercises, setExercises] = useState<AvailableExercise[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [selectedMuscleGroupId, setSelectedMuscleGroupId] = useState<string | null>(null);
  const [showMgDropdown, setShowMgDropdown] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("exercises")
        .select("id, name, muscle_groups(name)");
      const { data: mgData } = await supabase.from("muscle_groups").select("id, name");
      if (mgData) {
        setMuscleGroups(mgData);
      }
      if (data) {
        setExercises(
          data.map((d: any) => ({
            id: d.id,
            name: d.name,
            muscle_group_name: d.muscle_groups?.name,
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleCreateNewExercise = async () => {
    const name = searchQuery.trim();
    if (!name) return;
    if (!selectedMuscleGroupId) return;

    setIsAdding(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('exercises').insert({
        name,
        muscle_group_id: selectedMuscleGroupId,
        user_id: userData.user?.id
      }).select('id, name, muscle_groups(name)').single();
      
      if (error) throw error;
      
      const newEx: AvailableExercise = { 
        id: data.id, 
        name: data.name,
        muscle_group_name: data.muscle_groups?.name 
      };
      setExercises(prev => [...prev, newEx]);
      setIsCreatingExercise(false);
      setSearchQuery("");
      setSelectedMuscleGroupId(null);
      // Auto add it
      handleAdd(newEx);
    } catch (err) {
      console.error("Failed to create exercise", err);
      setIsAdding(false);
    }
  };

  const handleAdd = async (ex: AvailableExercise) => {
    if (!routineId || !workoutId || isAdding) return;
    setIsAdding(true);
    await addAdHocExerciseToActiveWorkout(routineId, workoutId, ex.id, ex.name, ex.muscle_group_name);
    setIsAdding(false);
    router.back();
  };

  const filtered = exercises.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Add Exercise",
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
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Absolute gradient covers the whole screen behind the transparent header */}
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={[colors.gradientTop, colors.bg]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>
        
        <View style={{ paddingTop: 24, flex: 1 }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            {!isCreatingExercise ? (
              <Pressable
                style={({ pressed }) => [
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.glassStrong,
                    borderRadius: 100,
                    paddingVertical: 14,
                    marginTop: 0,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: colors.glassStrongBorder,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                onPress={() => setIsCreatingExercise(true)}
              >
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={colors.accent}
                />
                <Text
                  style={[styles.workoutName, { color: colors.accent, marginLeft: 8 }]}
                >
                  Create Custom Exercise
                </Text>
              </Pressable>
            ) : (
              <View style={styles.customExerciseForm}>
                <TextInput
                  style={[styles.input, { marginBottom: 16 }]}
                  placeholder="Exercise Name"
                  placeholderTextColor={colors.textFaint}
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
                        !selectedMuscleGroupId && { color: colors.textFaint },
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
                      color={colors.textFaint}
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
                    style={[styles.formBtn, { backgroundColor: colors.bg }]}
                    onPress={() => {
                      setIsCreatingExercise(false);
                      setSearchQuery("");
                      setSelectedMuscleGroupId(null);
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: "700" }}>
                      Cancel
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.formBtn, { backgroundColor: colors.accent, opacity: isAdding ? 0.7 : 1 }]}
                    onPress={handleCreateNewExercise}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={{ color: "#fff", fontWeight: "700" }}>
                        Create & Add
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
          
          {!isCreatingExercise && (
            <View style={{ paddingHorizontal: 16 }}>
            <TextInput
              style={[styles.input, { marginBottom: 16 }]}
              placeholder="Search exercises..."
              placeholderTextColor={colors.textFaint}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoFocus
            />
            </View>
          )}

          {loading && !isCreatingExercise ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
            {filtered.map((ex, i) => (
              <Pressable
                key={ex.id}
                onPress={() => handleAdd(ex)}
                style={({ pressed }) => [
                  styles.workoutRow,
                  i !== filtered.length - 1 && styles.rowDivider,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View>
                  <Text style={styles.workoutName}>{ex.name}</Text>
                  {ex.muscle_group_name && (
                    <Text style={styles.workoutMeta}>{ex.muscle_group_name}</Text>
                  )}
                </View>
                <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
              </Pressable>
            ))}
          </ScrollView>
          )}
        </View>
      </View>
    </>
  );
}

const getStyles = (colors: any, isLight: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  input: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    paddingBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  workoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  workoutName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  workoutMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  customExerciseForm: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 16,
  },
  muscleGroupContainer: {
    marginTop: 12,
  },
  metricLabel: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  dropdownToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dropdownToggleText: {
    color: colors.text,
    fontSize: 15,
  },
  dropdownList: {
    maxHeight: 150,
    backgroundColor: colors.bgElevated,
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceBorder,
  },
  dropdownItemText: {
    color: colors.text,
    fontSize: 15,
  },
  dropdownItemTextActive: {
    color: colors.accent,
    fontWeight: "700",
  },
  formBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
