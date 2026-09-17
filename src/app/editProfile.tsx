import { useAuthStore } from "@/store/authStore";
import { calculateAge } from "@/utils/dateUtils";
import { useThemeStore } from "@/store/themeStore";
import { useSettingsStore } from "@/store/settingsStore";
import { COLORS, ThemeColors, useThemeColors } from "@/styles/appStyles";
import { supabase } from "@/api/supabase";
import { Stack, useRouter } from "expo-router";
import { useState, useMemo, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PickProfilePhoto } from "@/app/components/profile-photo";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const { weightUnit } = useSettingsStore();
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [originalEmail, setOriginalEmail] = useState(user?.email || "");
  
  useEffect(() => {
    // The public 'users' table might not have the email, so we fetch it directly from the auth session.
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser?.email) {
        setEmail(authUser.email);
        setOriginalEmail(authUser.email);
      }
      if (authUser?.user_metadata?.birthday) {
        const parts = authUser.user_metadata.birthday.split("-");
        if (parts.length === 3) {
          setBdayYear(parts[0]);
          setBdayMonth(parts[1]);
          setBdayDay(parts[2]);
        }
      }
      if (authUser?.user_metadata?.experience_level) setExperience(authUser.user_metadata.experience_level);
      if (authUser?.user_metadata?.bench_pr) setBenchPR(String(authUser.user_metadata.bench_pr));
      if (authUser?.user_metadata?.squat_pr) setSquatPR(String(authUser.user_metadata.squat_pr));
      if (authUser?.user_metadata?.deadlift_pr) setDeadliftPR(String(authUser.user_metadata.deadlift_pr));
    });
  }, []);
  const [bdayMonth, setBdayMonth] = useState("");
  const [bdayDay, setBdayDay] = useState("");
  const [bdayYear, setBdayYear] = useState("");
  const [heightFt, setHeightFt] = useState(user?.height_ft ? (weightUnit === "kgs" ? String(Math.round(user.height_ft * 30.48)) : String(user.height_ft)) : "");
    const [experience, setExperience] = useState("");
  const [benchPR, setBenchPR] = useState("");
  const [squatPR, setSquatPR] = useState("");
  const [deadliftPR, setDeadliftPR] = useState("");

  const [weightLbs, setWeightLbs] = useState(
    user?.weight_lbs 
      ? (weightUnit === "kgs" ? String(Number((user.weight_lbs * 0.453592).toFixed(1))) : String(user.weight_lbs)) 
      : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);

    try {
      // 1. Update public profile
      const updates = {
        username: username.trim(),
        age: (bdayMonth && bdayDay && bdayYear) ? calculateAge(bdayMonth, bdayDay, bdayYear) : null,
        height_ft: heightFt.trim() ? (weightUnit === "kgs" ? parseFloat((parseFloat(heightFt.trim()) / 30.48).toFixed(2)) : parseFloat(heightFt.trim())) : null,
        weight_lbs: weightLbs.trim() 
          ? (weightUnit === "kgs" ? parseFloat((parseFloat(weightLbs.trim()) / 0.453592).toFixed(1)) : parseFloat(weightLbs.trim())) 
          : null,
      };

            if (bdayMonth && bdayDay && bdayYear) {
        const authUpdates: Record<string, any> = {
          birthday: `${bdayYear}-${bdayMonth.padStart(2, '0')}-${bdayDay.padStart(2, '0')}`
        };
        if (experience) authUpdates.experience_level = experience;
        if (benchPR) authUpdates.bench_pr = parseInt(benchPR, 10);
        if (squatPR) authUpdates.squat_pr = parseInt(squatPR, 10);
        if (deadliftPR) authUpdates.deadlift_pr = parseInt(deadliftPR, 10);
        await supabase.auth.updateUser({ data: authUpdates });
      } else {
        const authUpdates: Record<string, any> = {};
        if (experience) authUpdates.experience_level = experience;
        if (benchPR) authUpdates.bench_pr = parseInt(benchPR, 10);
        if (squatPR) authUpdates.squat_pr = parseInt(squatPR, 10);
        if (deadliftPR) authUpdates.deadlift_pr = parseInt(deadliftPR, 10);
        if (Object.keys(authUpdates).length > 0) {
          await supabase.auth.updateUser({ data: authUpdates });
        }
      }
      
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      
      // 2. Check if email was changed
      const trimmedEmail = email.trim();
      if (trimmedEmail !== originalEmail) {
        // Show warning before actually changing auth email
        Alert.alert(
          "Email Change",
          "Changing your email will require you to log back in. Are you sure you want to proceed?",
          [
            { text: "Cancel", style: "cancel", onPress: () => setSaving(false) },
            { 
              text: "Proceed", 
              style: "destructive", 
              onPress: async () => {
                try {
                  const { error: authError } = await supabase.auth.updateUser({ email: trimmedEmail });
                  if (authError) throw authError;
                  
                  // If successful, sign out
                  await supabase.auth.signOut();
                  // The _layout auth listener will automatically redirect to login
                } catch (err: any) {
                  setError(err.message || "Failed to update email.");
                  setSaving(false);
                }
              }
            }
          ]
        );
        return; // Stop here, the alert callback handles the rest
      }

      setUser(data);
      router.back();
    } catch (err: any) {
      console.error("Update profile error:", err);
      setError(err.message || "Failed to update profile.");
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Edit Profile",
          headerTitleStyle: { color: colors.text, fontWeight: "700" },
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerBackTitle: "Back",
          headerTintColor: colors.text,
        }}
      />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.photoContainer}>
            <PickProfilePhoto size={100} />
            <Text style={styles.photoLabel}>Tap to change photo</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Experience Level</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {["beginner", "intermediate", "advanced"].map(level => (
                <Pressable
                  key={level}
                  style={[
                    { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
                    experience === level 
                      ? { backgroundColor: colors.accent, borderColor: colors.accent } 
                      : { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }
                  ]}
                  onPress={() => setExperience(level)}
                >
                  <Text style={{ color: experience === level ? colors.bg : colors.text, fontWeight: '600', textTransform: 'capitalize' }}>
                    {level}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Personal Records (lbs)</Text>
            <View style={styles.row}>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <TextInput
                  style={[styles.input, { textAlign: 'center', paddingHorizontal: 0 }]}
                  value={benchPR}
                  onChangeText={setBenchPR}
                  placeholder="Bench"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                <TextInput
                  style={[styles.input, { textAlign: 'center', paddingHorizontal: 0 }]}
                  value={squatPR}
                  onChangeText={setSquatPR}
                  placeholder="Squat"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <TextInput
                  style={[styles.input, { textAlign: 'center', paddingHorizontal: 0 }]}
                  value={deadliftPR}
                  onChangeText={setDeadliftPR}
                  placeholder="Deadlift"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1.5, marginRight: 8 }]}>
              <Text style={styles.label}>Birthday</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 4, textAlign: 'center', paddingHorizontal: 0 }]}
                  value={bdayMonth}
                  onChangeText={setBdayMonth}
                  placeholder="MM"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 4, textAlign: 'center', paddingHorizontal: 0 }]}
                  value={bdayDay}
                  onChangeText={setBdayDay}
                  placeholder="DD"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <TextInput
                  style={[styles.input, { flex: 1.5, textAlign: 'center', paddingHorizontal: 0 }]}
                  value={bdayYear}
                  onChangeText={setBdayYear}
                  placeholder="YYYY"
                  placeholderTextColor={colors.textFaint}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </View>

            <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>{weightUnit === "lbs" ? "Height (ft)" : "Height (cm)"}</Text>
              <TextInput
                style={styles.input}
                value={heightFt}
                onChangeText={setHeightFt}
                placeholder={weightUnit === "lbs" ? "e.g. 5.10" : "e.g. 180"}
                placeholderTextColor={colors.textFaint}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Weight ({weightUnit})</Text>
            <TextInput
              style={styles.input}
              value={weightLbs}
              onChangeText={setWeightLbs}
              placeholder="e.g. 180"
              placeholderTextColor={colors.textFaint}
              keyboardType="numeric"
            />
            
          </View>

        </ScrollView>

        <View style={styles.footer}>
          <Pressable 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={isLight ? "#141518" : colors.bg} />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const getStyles = (colors: ThemeColors, isLight: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 12,
  },
  photoLabel: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 12,
    fontWeight: "500",
  },
  field: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  hintText: {
    color: colors.textFaint,
    fontSize: 12,
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  saveButton: {
    backgroundColor: "#4169E1",
    height: 56,
    borderRadius: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: isLight ? "#141518" : colors.bg,
    fontSize: 16,
    fontWeight: "700",
  },
});
