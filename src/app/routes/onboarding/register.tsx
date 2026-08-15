import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Stack, useRouter } from "expo-router";
import { useState } from "react";
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

  const register = useAuthStore((state) => state.register);
  const user = useAuthStore((s) => s.user);

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
      const res = await api.post("/auth/register", {
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      });

      const { user, token } = res.data;
      await register(user, token);
      // Stack.Protected in RootLayout swaps to (tabs) automatically
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response.data?.message ?? "Unable to create account.");
      } else if (err.response?.status === 409) {
        setError("That email is already registered.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // redirect after registering to user setup questions
  if (user) {
    return <Redirect href="./setup" />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTitleAlign: "left",
          headerBackButtonDisplayMode: "minimal",
          headerStyle: {
            backgroundColor: "#141518",
          },
          headerShadowVisible: false,
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontSize: 30,
            fontWeight: "bold",
          },
        }}
      />

      <View style={styles.root}>
        <StatusBar barStyle="light-content" />

        <LinearGradient
          colors={["#141518", "#1B1C20", "#141518"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.safe}>
          <View style={styles.content}>
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>GYMBRO</Text>
            </View>

            <BlurView intensity={35} tint="dark" style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.eyebrow}>NEW HERE</Text>
                <Text style={styles.headline}>Create your{"\n"}account.</Text>
                <View style={styles.headlineBar} />

                <View style={styles.field}>
                  <Text style={styles.label}>USERNAME</Text>
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
                  <Text style={styles.label}>EMAIL</Text>
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
                  <Text style={styles.label}>PASSWORD</Text>
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
                  <Text style={styles.label}>CONFIRM PASSWORD</Text>
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
                  <Text style={styles.dividerText}>ALREADY A MEMBER</Text>
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

const YELLOW = "#ffd61f";
const GRAY_BORDER = "rgba(255,255,255,0.09)";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#141518" },
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brandRow: { flexDirection: "row", alignItems: "center", marginBottom: 28 },
  brandText: {
    color: "#EDEDEF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 6,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: GRAY_BORDER,
  },
  cardInner: {
    padding: 28,
    backgroundColor: Platform.select({
      ios: "rgba(30,31,35,0.38)",
      android: "rgba(30,31,35,0.78)",
      default: "rgba(30,31,35,0.6)",
    }),
  },
  eyebrow: {
    color: "#84878E",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 10,
  },
  headline: {
    color: "#EDEDEF",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.2,
    lineHeight: 34,
  },
  headlineBar: {
    width: 40,
    height: 3,
    borderRadius: 1,
    backgroundColor: YELLOW,
    marginTop: 16,
    marginBottom: 28,
  },
  field: { marginBottom: 16 },
  label: {
    color: "#6A6D74",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputShell: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    color: "#EDEDEF",
    fontSize: 15,
  },
  cta: {
    height: 54,
    borderRadius: 12,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: YELLOW,
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginTop: 4,
  },
  ctaText: {
    color: "#F5F5F6",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 18,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: GRAY_BORDER },
  dividerText: {
    color: "#54575D",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    marginHorizontal: 12,
  },
  secondaryCta: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryCtaText: { color: "#EDEDEF", fontSize: 14, fontWeight: "700" },
  footer: {
    color: "#46484D",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 24,
  },
  errorText: {
    color: YELLOW,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
});
