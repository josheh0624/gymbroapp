import { supabase } from "@/api/supabase";
import { useAuthStore } from "@/store/authStore";
import { useRoutineStore } from "@/store/routineStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useThemeColors } from "@/styles/appStyles";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export interface GeneratedExercise {
  name: string;
  muscleGroup?: string;
  sets: number;
  reps: number;
  weight?: number;
}

export interface GeneratedWorkout {
  name: string;
  days: number[];
  exercises: GeneratedExercise[];
}

export interface GeneratedRoutine {
  routineName: string;
  workouts: GeneratedWorkout[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  routine?: GeneratedRoutine;
  isSaved?: boolean;
}

interface AiChatModalProps {
  visible: boolean;
  onClose: () => void;
}

const DAY_NAMES = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
function formatWorkoutDays(days?: number[]): string {
  if (!days || days.length === 0) return "Flexible";
  return days.map((d) => DAY_NAMES[d] || `Day ${d}`).join(", ");
}

// On iOS Simulator, 'localhost' works. On Android emulator use '10.0.2.2'.
const API_URL =
  Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

export default function AiChatModal({ visible, onClose }: AiChatModalProps) {
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const streak = useRoutineStore((s) => s.streak);
  const workedOutToday = useRoutineStore((s) => s.workedOutToday);
  const activeRoutineId = useRoutineStore((s) => s.activeRoutineId);
  const routineList = useRoutineStore((s) => s.routineList);
  const activeRoutine = routineList.find((r) => r.id === activeRoutineId)?.name;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: user?.username
        ? `Yo ${user.username}! Bro is here. Ask me anything, or tell me what split you want (e.g. 'Make me a 3-day Push Pull Legs routine') and I'll build it for you!`
        : "Yo! Bro is here. Ask me anything, or tell me what split you want (e.g. 'Make me a 3-day Push Pull Legs routine') and I'll build it for you!",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Update greeting with username once loaded if untouched
  useEffect(() => {
    if (user?.username && messages.length === 1 && messages[0].id === "1") {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: `Yo ${user.username}! Bro is here. Ask me anything, or tell me what split you want (e.g. 'Make me a 3-day Push Pull Legs routine') and I'll build it for you!`,
        },
      ]);
    }
  }, [user?.username]);

  const getUserContext = async () => {
    let benchPR: number | null = null;
    let squatPR: number | null = null;
    let deadliftPR: number | null = null;
    let experienceLevel: string | null = null;
    let primaryGoals: string[] | string | null = null;
    let birthday: string | null = null;
    let age: number | null = user?.age ?? null;
    let heightFt: number | null = user?.height_ft ?? null;
    let weightLbs: number | null = user?.weight_lbs ?? null;
    let sex: string | null = user?.sex ?? null;
    let username: string | null = user?.username ?? null;
    let email: string | null = user?.email ?? null;

    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      const metadata = authUser?.user_metadata;
      if (metadata) {
        if (metadata.bench_pr) benchPR = Number(metadata.bench_pr);
        if (metadata.squat_pr) squatPR = Number(metadata.squat_pr);
        if (metadata.deadlift_pr) deadliftPR = Number(metadata.deadlift_pr);
        if (metadata.experience_level)
          experienceLevel = metadata.experience_level;
        if (metadata.primary_goal) primaryGoals = metadata.primary_goal;
        if (metadata.birthday) birthday = metadata.birthday;
        if (metadata.username && !username) username = metadata.username;
      }
      if (authUser?.email && !email) email = authUser.email;

      // Fallback query to public.users if any registration fields aren't hydrated in store
      if (
        authUser?.id &&
        (!age || !heightFt || !weightLbs || !sex || !primaryGoals)
      ) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("age, height_ft, weight_lbs, sex, primary_goal, username")
          .eq("id", authUser.id)
          .maybeSingle();

        if (dbUser) {
          if (!age && dbUser.age) age = dbUser.age;
          if (!heightFt && dbUser.height_ft) heightFt = dbUser.height_ft;
          if (!weightLbs && dbUser.weight_lbs) weightLbs = dbUser.weight_lbs;
          if (!sex && dbUser.sex) sex = dbUser.sex;
          if (!primaryGoals && dbUser.primary_goal)
            primaryGoals = dbUser.primary_goal;
          if (!username && dbUser.username) username = dbUser.username;
        }
      }
    } catch (e) {
      console.warn("Could not fetch user metadata for AI context", e);
    }

    // Format height nicely for the AI (feet/inches + cm)
    let heightFormatted: string | null = null;
    if (heightFt) {
      const totalInches = Math.round(heightFt * 12);
      const ft = Math.floor(totalInches / 12);
      const inches = totalInches % 12;
      const cm = Math.round(heightFt * 30.48);
      heightFormatted = `${ft}'${inches}" (${cm} cm)`;
    }

    return {
      username: username || "Lifter",
      email: email || null,
      age,
      birthday,
      sex,
      heightFt,
      heightFormatted,
      weightLbs,
      preferredUnit: weightUnit,
      experienceLevel,
      primaryGoals: primaryGoals || user?.primary_goal || null,
      benchPR,
      squatPR,
      deadliftPR,
      activeRoutine: activeRoutine || null,
      streak: streak ?? 0,
      workedOutToday: !!workedOutToday,
    };
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || loading) return;

    if (text.length > 1000) {
      Alert.alert(
        "Message Too Long",
        "Please keep your question under 1,000 characters bro!",
      );
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    // Add user message & clear input
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setLoading(true);

    try {
      // Gather user context and history
      const userContext = await getUserContext();
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Retrieve authenticated Supabase access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: text,
          history: history.slice(-10), // Limit history to last 10 messages
          userContext,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.reply) {
        throw new Error(data.error || `Server returned status ${res.status}`);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
          routine: data.routine || undefined,
          isSaved: false,
        },
      ]);
    } catch (err: any) {
      console.error("AI Chat error:", err);
      const isNetworkError =
        err.message?.includes("fetch") ||
        err.message?.includes("Network request failed");
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: isNetworkError
            ? "Sorry bro, my connection dropped! Make sure the backend server is running."
            : `Sorry bro! ${err.message || "Failed to generate reply"}. Try asking again!`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoutine = async (
    messageId: string,
    routine: GeneratedRoutine,
  ) => {
    if (savingId) return;
    setSavingId(messageId);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData?.user) {
        Alert.alert(
          "Sign In Required",
          "You must be signed in to save routines to your account.",
        );
        return;
      }
      const userId = userData.user.id;

      // 1. Fetch existing exercises to match
      const { data: existingExercises } = await supabase
        .from("exercises")
        .select("id, name");

      const exerciseMap: Record<string, string> = {};
      if (existingExercises) {
        for (const ex of existingExercises) {
          exerciseMap[ex.name.toLowerCase().trim()] = ex.id;
        }
      }

      // Default fallback muscle group ID (Chest / General)
      const fallbackMuscleGroupId = 1;
      const resolvedExerciseIds: Record<string, string> = {};

      for (const workout of routine.workouts) {
        for (const ex of workout.exercises) {
          const cleanName = ex.name.trim();
          const key = cleanName.toLowerCase();

          if (exerciseMap[key]) {
            resolvedExerciseIds[cleanName] = exerciseMap[key];
            continue;
          }

          // Fuzzy search
          const matched = existingExercises?.find(
            (e) =>
              e.name.toLowerCase().includes(key) ||
              key.includes(e.name.toLowerCase()),
          );
          if (matched) {
            resolvedExerciseIds[cleanName] = matched.id;
            continue;
          }

          // Try inserting custom exercise
          try {
            const { data: newEx, error: insertExErr } = await supabase
              .from("exercises")
              .insert({
                name: cleanName,
                muscle_group_id: fallbackMuscleGroupId,
                user_id: userId,
              })
              .select("id")
              .single();

            if (!insertExErr && newEx) {
              resolvedExerciseIds[cleanName] = newEx.id;
              exerciseMap[key] = newEx.id;
              continue;
            }
          } catch {
            // Ignore insert restriction if present
          }

          // Fallback to first available exercise if RLS blocks custom exercise creation
          if (existingExercises && existingExercises.length > 0) {
            resolvedExerciseIds[cleanName] = existingExercises[0].id;
          }
        }
      }

      // 2. Create the workout_routines entry
      const { data: routineRecord, error: rError } = await supabase
        .from("workout_routines")
        .insert({
          name: routine.routineName,
          user_id: userId,
          is_prebuilt: false,
        })
        .select("id")
        .single();

      if (rError || !routineRecord) {
        throw new Error(rError?.message || "Failed to create routine");
      }

      const createdWorkoutIds: string[] = [];

      // 3. Create each workout & workout_exercises
      for (const workout of routine.workouts) {
        const { data: workoutRecord, error: wError } = await supabase
          .from("workouts")
          .insert({
            name: workout.name,
            days: workout.days && workout.days.length > 0 ? workout.days : [1],
            user_id: userId,
          })
          .select("id")
          .single();

        if (wError || !workoutRecord) {
          throw new Error(
            wError?.message || `Failed to create workout: ${workout.name}`,
          );
        }

        createdWorkoutIds.push(workoutRecord.id);

        if (workout.exercises && workout.exercises.length > 0) {
          const exercisesToInsert: {
            workout_id: string;
            exercise_id: string;
            sets: number;
            reps: number;
            weight: number;
            order_index: number;
          }[] = [];

          workout.exercises.forEach((ex, idx) => {
            const exerciseId = resolvedExerciseIds[ex.name.trim()];
            if (exerciseId) {
              exercisesToInsert.push({
                workout_id: workoutRecord.id,
                exercise_id: exerciseId,
                sets: ex.sets || 3,
                reps: ex.reps || 10,
                weight: ex.weight || 0,
                order_index: idx,
              });
            }
          });

          if (exercisesToInsert.length > 0) {
            const { error: weError } = await supabase
              .from("workout_exercises")
              .insert(exercisesToInsert);
            if (weError) {
              console.warn(
                "Error inserting workout exercises:",
                weError.message,
              );
            }
          }
        }
      }

      // 4. Link workouts in workout_routine_days
      if (createdWorkoutIds.length > 0) {
        const daysPayload = createdWorkoutIds.map((workoutId, idx) => ({
          routine_id: routineRecord.id,
          workout_id: workoutId,
          order_index: idx,
        }));

        const { error: dError } = await supabase
          .from("workout_routine_days")
          .insert(daysPayload);

        if (dError) {
          console.warn("Error linking routine days:", dError.message);
        }
      }

      // 5. Refresh store so it appears in the Workouts tab immediately!
      await useRoutineStore.getState().fetchRoutineList();

      // 6. Update message UI state
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isSaved: true } : m)),
      );

      Alert.alert(
        "Routine Saved!",
        `"${routine.routineName}" has been added to your Workouts tab! Would you like to make it your active routine now?`,
        [
          { text: "Not Now", style: "cancel" },
          {
            text: "Set Active",
            onPress: async () => {
              await useRoutineStore
                .getState()
                .fetchRoutineById(routineRecord.id);
              useRoutineStore.getState().setActiveRoutine(routineRecord.id);
            },
          },
        ],
      );
    } catch (err: any) {
      console.error("Save routine error:", err);
      Alert.alert("Error", err.message || "Could not save routine.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: colors.bg }]}
      >
        {/* Header */}
        <View
          style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}
        >
          <View style={styles.headerTitleRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                Bro AI Coach
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Always in your corner
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            hitSlop={12}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => {
            const isUser = item.role === "user";
            const isSavingThis = savingId === item.id;

            return (
              <View
                style={[
                  styles.bubbleContainer,
                  isUser ? styles.userContainer : styles.botContainer,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: "#4169E1" }]
                      : [
                          styles.botBubble,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.surfaceBorder,
                          },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      { color: isUser ? "#FFF" : colors.text },
                    ]}
                  >
                    {item.content}
                  </Text>
                </View>

                {/* Structured Routine Card */}
                {item.routine && (
                  <View
                    style={[
                      styles.routineCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.surfaceBorder,
                      },
                    ]}
                  >
                    <View style={styles.routineHeader}>
                      <View style={styles.routineIconBadge}>
                        <Ionicons name="barbell" size={20} color="#FFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.routineTitle, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {item.routine.routineName}
                        </Text>
                        <Text
                          style={[
                            styles.routineSubtitle,
                            { color: colors.textMuted },
                          ]}
                        >
                          {item.routine.workouts.length} Workout Days • Custom
                          Plan
                        </Text>
                      </View>
                    </View>

                    {/* Workouts Breakdown */}
                    <View style={styles.workoutsContainer}>
                      {item.routine.workouts.map(
                        (workout: GeneratedWorkout, wIdx: number) => (
                          <View
                            key={wIdx}
                            style={[
                              styles.workoutRow,
                              {
                                borderTopColor: colors.surfaceBorder,
                                borderTopWidth: wIdx > 0 ? 1 : 0,
                              },
                            ]}
                          >
                            <View style={styles.workoutHeaderRow}>
                              <Text
                                style={[
                                  styles.workoutName,
                                  { color: colors.text },
                                ]}
                              >
                                {workout.name}
                              </Text>
                              <View
                                style={[
                                  styles.dayBadge,
                                  { backgroundColor: colors.accentMuted },
                                ]}
                              >
                                <Text style={styles.dayBadgeText}>
                                  {formatWorkoutDays(workout.days)}
                                </Text>
                              </View>
                            </View>

                            {/* Exercise List */}
                            <View style={styles.exercisesList}>
                              {workout.exercises.map(
                                (ex: GeneratedExercise, eIdx: number) => (
                                  <View key={eIdx} style={styles.exerciseItem}>
                                    <Text
                                      style={[
                                        styles.bulletDot,
                                        { color: "#4169E1" },
                                      ]}
                                    >
                                      •
                                    </Text>
                                    <Text
                                      style={[
                                        styles.exerciseName,
                                        { color: colors.text },
                                      ]}
                                    >
                                      {ex.name}{" "}
                                      <Text style={styles.exerciseDetails}>
                                        ({ex.sets} sets × {ex.reps} reps
                                        {ex.weight ? ` @ ${ex.weight} lbs` : ""}
                                        )
                                      </Text>
                                    </Text>
                                  </View>
                                ),
                              )}
                            </View>
                          </View>
                        ),
                      )}
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                      style={[
                        styles.saveBtn,
                        item.isSaved && styles.savedBtn,
                        isSavingThis && { opacity: 0.7 },
                      ]}
                      onPress={() => handleSaveRoutine(item.id, item.routine!)}
                      disabled={item.isSaved || isSavingThis}
                    >
                      {isSavingThis ? (
                        <View style={styles.saveBtnContent}>
                          <ActivityIndicator size="small" color="#FFF" />
                          <Text style={styles.saveBtnText}>
                            Saving to your workouts...
                          </Text>
                        </View>
                      ) : item.isSaved ? (
                        <View style={styles.saveBtnContent}>
                          <Ionicons
                            name="checkmark-circle"
                            size={18}
                            color="#FFF"
                          />
                          <Text style={styles.saveBtnText}>
                            Added to Your Workouts!
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.saveBtnContent}>
                          <Ionicons name="add" size={20} color="#FFF" />
                          <Text style={styles.saveBtnText}>
                            Save Routine to App
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />

        {/* Typing indicator */}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#4169E1" />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Bro is thinking...
            </Text>
          </View>
        )}

        {/* Input Bar */}
        <View
          style={[
            styles.inputRow,
            {
              borderTopColor: colors.surfaceBorder,
              backgroundColor: colors.bg,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.surfaceBorder,
              },
            ]}
            placeholder="Ask Bro for a routine, split, or advice..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            maxLength={1000}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, { opacity: inputText.trim() ? 1 : 0.5 }]}
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Ionicons name="arrow-up" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4169E1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFF", fontWeight: "900", fontSize: 15 },
  title: { fontSize: 17, fontWeight: "700" },
  subtitle: { fontSize: 12 },
  closeBtn: { padding: 4 },
  list: { padding: 16, gap: 12 },
  bubbleContainer: { maxWidth: "88%", marginBottom: 8 },
  userContainer: { alignSelf: "flex-end" },
  botContainer: { alignSelf: "flex-start" },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: { borderBottomRightRadius: 4 },
  botBubble: { borderBottomLeftRadius: 4, borderWidth: 1 },
  messageText: { fontSize: 15, lineHeight: 22 },

  // Routine Card Styles
  routineCard: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    width: "100%",
  },
  routineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  routineIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#4169E1",
    justifyContent: "center",
    alignItems: "center",
  },
  routineTitle: { fontSize: 16, fontWeight: "800" },
  routineSubtitle: { fontSize: 12, marginTop: 2 },
  workoutsContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },
  workoutRow: {
    paddingVertical: 10,
  },
  workoutHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  workoutName: { fontSize: 14, fontWeight: "700" },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4169E1",
  },
  exercisesList: {
    paddingLeft: 4,
    gap: 4,
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletDot: {
    fontSize: 14,
    marginRight: 6,
    lineHeight: 18,
  },
  exerciseName: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  exerciseDetails: {
    color: "#8E8E93",
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: "#4169E1",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  savedBtn: {
    backgroundColor: "#30D158",
  },
  saveBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  saveBtnText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  loadingText: { fontSize: 13 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    fontSize: 15,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4169E1",
    justifyContent: "center",
    alignItems: "center",
  },
});
