import { supabase } from "@/api/supabase";
import { useAuthStore } from "@/store/authStore";
import { useOnboardingStore } from "@/store/onboardingStore";
import { useThemeStore } from "@/store/themeStore";
import { COLORS, useThemeColors, ThemeColors } from "@/styles/appStyles";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Stack, useRouter } from "expo-router";
import { useState, useMemo } from "react";
import {
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const router = useRouter();


  const user = useAuthStore((s) => s.user);
  const colors = useThemeColors();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    setError("");

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!trimmedUsername) {
      setError("Enter a username.");
      return;
    }
    if (!emailValid) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      // Create the account first so we can catch "Email already taken" instantly
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: password,
        options: {
          data: { username: trimmedUsername }
        }
      });
      
      if (error) throw error;
      if (!data.user) throw new Error("Failed to create account.");

      // Store credentials so setup.tsx can sync them, but account IS already created
      const setRegisterData = useOnboardingStore.getState().setRegisterData;
      setRegisterData(trimmedUsername, trimmedEmail, password);
      
      router.push("./setup");
    } catch (err: any) {
      console.error("Register error:", err);
      setError(err.message || "Unable to process account info.");
    } finally {
      setSubmitting(false);
    }
  };

  // Prevent auto-redirect because user isn't created yet
  // if (user) {
  //  return <Redirect href="./setup" />;
  // }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTitleAlign: "left",
          headerBackButtonDisplayMode: "minimal",
          headerStyle: {
            backgroundColor: colors.bg,
          },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontSize: 30,
            fontWeight: "bold",
          },
        }}
      />

      <View style={styles.root}>
        <StatusBar barStyle={isLight ? "dark-content" : "light-content"} />

        <LinearGradient
          colors={[colors.bg, colors.bg, colors.bg]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.safe}>
          <View style={styles.content}>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>Gymbro</Text>
            </View>

            <BlurView intensity={35} tint={isLight ? "extraLight" : "dark"} style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.eyebrow}>New Here</Text>
                <Text style={styles.headline}>Create your{"\n"}account.</Text>
                <View style={styles.headlineBar} />

                <View style={styles.field}>
                  <Text style={styles.label}>Username</Text>
                  <View style={styles.inputShell}>
                    <TextInput
                      placeholder="gymbro"
                      placeholderTextColor="#5A5D63"
                      style={styles.input}
                      autoCapitalize="none"
                      value={username}
                      onChangeText={setUsername}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputShell}>
                    <TextInput
                      placeholder="you@example.com"
                      placeholderTextColor="#5A5D63"
                      style={styles.input}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputShell}>
                    <TextInput
                      placeholder="••••••••"
                      placeholderTextColor="#5A5D63"
                      style={styles.input}
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputShell}>
                    <TextInput
                      placeholder="••••••••"
                      placeholderTextColor="#5A5D63"
                      style={styles.input}
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={styles.cta}
                  activeOpacity={0.85}
                  onPress={handleRegister}
                  disabled={submitting}
                >
                  <Text style={styles.ctaText}>
                    {submitting ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Already a Member</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.secondaryCta}
                  activeOpacity={0.7}
                  onPress={() => router.push("../login")}
                >
                  <Text style={styles.secondaryCtaText}>Log in instead</Text>
                </TouchableOpacity>
              </View>
            </BlurView>

            <Text style={styles.footer}>Josh Haney 2026</Text>
          </View>
        </View>
      </View>
    </>
  );
}

const getStyles = (colors: ThemeColors, isLight: boolean) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  brandText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  card: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cardInner: {
    padding: 28,
    backgroundColor: isLight ? "transparent" : Platform.select({
      ios: "rgba(30,31,35,0.38)",
      android: "rgba(30,31,35,0.78)",
      default: "rgba(30,31,35,0.6)",
    }),
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  headline: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 34,
  },
  headlineBar: {
    width: 40,
    height: 3,
    borderRadius: 1,
    backgroundColor: COLORS.accent,
    marginTop: 16,
    marginBottom: 28,
  },
  field: { marginBottom: 16 },
  label: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "normal",
    marginBottom: 8,
  },
  inputShell: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 15,
  },
  cta: {
    height: 54,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginTop: 4,
  },
  ctaText: {
    color: isLight ? "#000" : colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.surfaceBorder },
  dividerText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginHorizontal: 12,
  },
  secondaryCta: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryCtaText: { color: colors.text, fontSize: 14, fontWeight: "700" },
  footer: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 24,
  },
  errorText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
});
