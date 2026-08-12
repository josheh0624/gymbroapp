import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Stack } from "expo-router";
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

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);

  const handleLogin = async () => {
    setError("");

    const trimmedEmail = email.trim();
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!emailValid) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/login", {
        email: trimmedEmail,
        password,
      });

      const { user, token } = res.data;
      await login(user, token);
      // Stack.Protected in RootLayout swaps to (tabs) automatically
    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response.data?.message ?? "Invalid credentials.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  //redirect after logging in
  if (user) {
    return <Redirect href="/(tabs)" />;
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

        {/* base gradient — flat charcoal, no color mixing */}
        <LinearGradient
          colors={["#141518", "#1B1C20", "#141518"]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.safe}>
          <View style={styles.content}>
            {/* wordmark */}
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>GYMBRO</Text>
            </View>

            {/* glass card */}
            <BlurView intensity={35} tint="dark" style={styles.card}>
              <View style={styles.cardInner}>
                <Text style={styles.eyebrow}>WELCOME BACK</Text>
                <Text style={styles.headline}>
                  Log in and{"\n"}get to work.
                </Text>
                <View style={styles.headlineBar} />

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

                <TouchableOpacity style={styles.forgot}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={styles.cta}
                  activeOpacity={0.85}
                  onPress={handleLogin}
                  disabled={submitting}
                >
                  <Text style={styles.ctaText}>
                    {submitting ? "LOGGING IN..." : "LOG IN"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>NEW HERE</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.secondaryCta}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryCtaText}>Create an account</Text>
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

const RED = "#FF2A3C";
const GRAY_BORDER = "rgba(255,255,255,0.09)";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#141518",
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // single ambient glow, red, top-center only
  glow: {
    position: "absolute",
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: 999,
    backgroundColor: RED,
    top: -width * 0.7,
    left: -width * 0.05,
    opacity: 0.14,
  },

  // brand
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },
  brandDash: {
    width: 16,
    height: 3,
    borderRadius: 1,
    backgroundColor: RED,
    marginRight: 10,
  },
  brandText: {
    color: "#EDEDEF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 6,
  },

  // glass card — steel gray, sharper corners than a "soft" glass card
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
    backgroundColor: RED,
    marginTop: 16,
    marginBottom: 28,
  },

  field: {
    marginBottom: 16,
  },
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

  forgot: {
    alignSelf: "flex-end",
    marginTop: 2,
    marginBottom: 24,
  },
  forgotText: {
    color: "#84878E",
    fontSize: 13,
    fontWeight: "600",
  },

  cta: {
    height: 54,
    borderRadius: 12,
    backgroundColor: RED,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: RED,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
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
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: GRAY_BORDER,
  },
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
  secondaryCtaText: {
    color: "#EDEDEF",
    fontSize: 14,
    fontWeight: "700",
  },

  footer: {
    color: "#46484D",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 24,
  },
  errorText: {
    color: RED,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
});
