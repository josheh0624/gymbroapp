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
  Alert,
} from "react-native";

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  const [isVerified, setIsVerified] = useState(false);
  
  // Verification State
  const [currentPassword, setCurrentPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Deletion State
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const executeDelete = async () => {
    if (!user) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      // Standard Supabase community pattern for self-deletion:
      // Call an RPC function if it exists, or delete the public profile which might trigger a backend deletion.
      
      // 1. Try RPC (Must be set up by user in Supabase dashboard)
      const { error: rpcError } = await supabase.rpc('delete_user');
      
      if (rpcError) {
        throw new Error("RPC 'delete_user' failed or is not configured in Supabase. Please set it up in the SQL Editor.");
      }

      // 2. Delete public profile (Just in case the RPC doesn't do it, though usually a trigger handles this)
      await supabase.from('users').delete().eq('id', user.id);

      // 3. Log them out
      await logout();
      
      alert("Your account has been successfully deleted.");
    } catch (err: any) {
      console.error("Delete error:", err);
      setDeleteError(err.message || "Failed to delete account. Please contact support.");
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Final Confirmation",
      "Are you absolutely sure you want to permanently delete your account? All your workouts, routines, and data will be lost forever.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Yes, Delete Everything", 
          style: "destructive", 
          onPress: executeDelete 
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Delete Account",
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
              <Text style={styles.subhead}>For your security, please enter your password to authorize account deletion.</Text>

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
              <Text style={styles.headlineDanger}>Danger Zone</Text>
              <Text style={styles.subhead}>
                You are about to permanently delete your account. This action cannot be undone. All of your data will be wiped from our servers immediately.
              </Text>

              {deleteError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{deleteError}</Text>
                </View>
              )}

              <Pressable 
                style={[styles.dangerButton, deleting && styles.actionButtonDisabled]} 
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color={colors.bg} />
                ) : (
                  <Text style={styles.dangerButtonText}>Permanently Delete Account</Text>
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
  headlineDanger: {
    color: "#FF3B30",
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
  dangerButton: {
    backgroundColor: "#FF3B30",
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
  dangerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
