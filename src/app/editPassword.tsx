import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { ThemeColors, useThemeColors } from "@/styles/appStyles";
import { supabase } from "@/api/supabase";
import { Stack, useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function EditPasswordScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  const [isVerified, setIsVerified] = useState(false);
  
  // Verification State
  const [currentPassword, setCurrentPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // New Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!currentPassword.trim()) return;
    setVerifying(true);
    setVerifyError(null);

    try {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser?.email) throw new Error("Could not find auth user email.");

      const { error } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: currentPassword,
      });

      if (error) throw error;
      
      setIsVerified(true);
    } catch (err: any) {
      console.error("Verification error:", err);
      setVerifyError("Incorrect password. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleUpdate = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setUpdateError("Please fill out both fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setUpdateError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setUpdateError("Password must be at least 6 characters.");
      return;
    }

    setUpdating(true);
    setUpdateError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      
      alert("Password successfully updated!");
      router.back();
    } catch (err: any) {
      console.error("Update error:", err);
      setUpdateError(err.message || "Failed to update password.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: isVerified ? "Change Password" : "Security",
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
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {!isVerified ? (
            <View style={styles.section}>
              <Text style={styles.headline}>Verify your identity</Text>
              <Text style={styles.subhead}>Please enter your current password to access the password change screen.</Text>

              {verifyError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{verifyError}</Text>
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Current Password</Text>
                <TextInput
                  style={styles.input}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textFaint}
                  secureTextEntry
                  autoCapitalize="none"
                  autoFocus
                />
              </View>

              <Pressable 
                style={[styles.actionButton, verifying && styles.actionButtonDisabled]} 
                onPress={handleVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator color={isLight ? "#141518" : colors.bg} />
                ) : (
                  <Text style={styles.actionButtonText}>Verify Password</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.headline}>Set new password</Text>
              <Text style={styles.subhead}>Your new password must be at least 6 characters long.</Text>

              {updateError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{updateError}</Text>
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textFaint}
                  secureTextEntry
                  autoCapitalize="none"
                  autoFocus
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textFaint}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <Pressable 
                style={[styles.actionButton, updating && styles.actionButtonDisabled]} 
                onPress={handleUpdate}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator color={isLight ? "#141518" : colors.bg} />
                ) : (
                  <Text style={styles.actionButtonText}>Update Password</Text>
                )}
              </Pressable>
            </View>
          )}

        </ScrollView>
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
  section: {
    marginTop: 20,
  },
  headline: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  subhead: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
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
  actionButton: {
    backgroundColor: "#4169E1",
    height: 56,
    borderRadius: 120,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: isLight ? "#141518" : colors.bg,
    fontSize: 16,
    fontWeight: "700",
  },
});
