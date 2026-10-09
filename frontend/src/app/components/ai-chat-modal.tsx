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

  // Streamlined client context: only passes dynamic in-memory store values.
  // The backend server-side identity binder automatically verifies user profile data.
  const getClientContext = () => ({
    preferredUnit: weightUnit,
    activeRoutine: activeRoutine || null,
    streak: streak ?? 0,
    workedOutToday: !!workedOutToday,
  });

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
      // Gather lightweight in-memory client state instantly
      const userContext = getClientContext();
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

      const assistantId = (Date.now() + 1).toString();
      let assistantContent = "";
      let generatedRoutine: GeneratedRoutine | undefined;

      // Add initial assistant bubble for streaming
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          isSaved: false,
        },
      ]);

      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          ...headers,
          Accept: "text/event-stream, application/json",
        },
        body: JSON.stringify({
          message: text,
          history: history.slice(-10), // Limit history to last 10 messages
          userContext,
          stream: true,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (
        contentType.includes("text/event-stream") &&
        res.body &&
        typeof (res.body as any).getReader === "function"
      ) {
        // Real-Time Streaming: Read chunks as they arrive from Gemini
        const reader = (res.body as any).getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const payloadStr = trimmed.slice(5).trim();
            if (payloadStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(payloadStr);
              if (parsed.type === "text" && parsed.delta) {
                assistantContent += parsed.delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: assistantContent }
                      : m,
                  ),
                );
              } else if (parsed.type === "routine" && parsed.routine) {
                generatedRoutine = parsed.routine;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, routine: generatedRoutine }
                      : m,
                  ),
                );
              } else if (parsed.type === "error" && parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }

        // If stream ended with no content, fallback to default
        if (!assistantContent) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "I'm on it bro! Let's get right back to the workout. What are we lifting next?",
                  }
                : m,
            ),
          );
        }
      } else {
        // Standard JSON fallback
        const data = await res.json();

        if (!res.ok || !data.reply) {
          throw new Error(data.error || `Server returned status ${res.status}`);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: data.reply,
                  routine: data.routine || undefined,
                }
              : m,
          ),
        );
      }
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
      // 1. Retrieve authenticated Supabase access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      // 2. 1-Trip Atomic Server Routine Persistence (replaces 10-20 client DB calls)
      const res = await fetch(`${API_URL}/save-routine`, {
        method: "POST",
        headers,
        body: JSON.stringify({ routine }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save routine.");
      }

      const routineId = data.routineId;

      // 3. Refresh store so it appears in the Workouts tab immediately!
      await useRoutineStore.getState().fetchRoutineList();

      // 4. Update message UI state
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
              if (routineId) {
                await useRoutineStore
                  .getState()
                  .fetchRoutineById(routineId);
                useRoutineStore.getState().setActiveRoutine(routineId);
              }
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
