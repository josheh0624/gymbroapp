import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    LayoutAnimation,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const TOTAL_STEPS = 4;

const STEP_META = [
  { eyebrow: "STEP 1 OF 4", headline: "How old\nare you?" },
  { eyebrow: "STEP 2 OF 4", headline: "How tall\nare you?" },
  { eyebrow: "STEP 3 OF 4", headline: "What's your\nweight?" },
  { eyebrow: "STEP 4 OF 4", headline: "What's your\ngender?" },
];

const SEX_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

export default function SetupScreen() {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [step, setStep] = useState(0);

  const [age, setAge] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [sex, setSex] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLastStep = step === TOTAL_STEPS - 1;

  const animateStepChange = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  };

  const goNext = () => {
    if (!isLastStep) {
      animateStepChange();
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const goBack = () => {
    if (step === 0) return;
    animateStepChange();
    setError("");
    setStep((s) => s - 1);
  };

  const handleContinue = () => {
    setError("");

    if (step === 0) {
      if (!age) {
        goNext();
        return;
      }
      const ageNum = parseInt(age, 10);
      if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
        setError("Enter a valid age, or skip this one.");
        return;
      }
    }

    if (step === 1) {
      if (!feet && !inches) {
        goNext();
        return;
      }
      const feetNum = parseInt(feet || "0", 10);
      const inchesNum = parseInt(inches || "0", 10);
      if (!feet || isNaN(feetNum) || feetNum < 3 || feetNum > 8) {
        setError("Enter a valid height, or skip this one.");
        return;
      }
      if (isNaN(inchesNum) || inchesNum < 0 || inchesNum > 11) {
        setError("Inches must be between 0 and 11.");
        return;
      }
    }

    if (step === 2) {
      if (!weightLbs) {
        goNext();
        return;
      }
      const weightNum = parseInt(weightLbs, 10);
      if (isNaN(weightNum) || weightNum < 50 || weightNum > 600) {
        setError("Enter a valid weight, or skip this one.");
        return;
      }
    }

    // step 3 (sex) is a pill select — nothing to validate, selection or skip
    goNext();
  };

  const handleSkip = () => {
    setError("");
    if (step === 0) setAge("");
    if (step === 1) {
      setFeet("");
      setInches("");
    }
    if (step === 2) setWeightLbs("");
    if (step === 3) setSex(null);
    goNext();
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {};

      if (age) payload.age = parseInt(age, 10);
      if (feet) {
        const feetNum = parseInt(feet, 10);
        const inchesNum = parseInt(inches || "0", 10);
        payload.height_ft = Math.round((feetNum + inchesNum / 12) * 100) / 100;
      }
      if (weightLbs) payload.weight_lbs = parseInt(weightLbs, 10);
      if (sex) payload.sex = sex;

      const { data } = await api.patch("/users/setup", payload);
      setUser(data); // sync the store with what's actually persisted

      router.replace("/(tabs)");
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // guard: shouldn't be able to land here without being registered/logged in
  if (!user) {
    return <Redirect href="../login" />;
  }

  const meta = STEP_META[step];
  const ctaLabel = submitting
    ? "SAVING..."
    : isLastStep
      ? "COMPLETE SETUP"
      : "CONTINUE";
  const skipLabel = isLastStep ? "Skip & finish setup" : "Skip this question";

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.root}>
        <StatusBar barStyle="light-content" />

        <LinearGradient
          colors={["#141518", "#1B1C20", "#141518"]}
          style={StyleSheet.absoluteFill}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.brandRow}>
              <Text style={styles.brandText}>GYMBRO</Text>
            </View>

            <BlurView intensity={35} tint="dark" style={styles.card}>
              <View style={styles.cardInner}>
                <View style={styles.topRow}>
                  <TouchableOpacity
                    onPress={goBack}
                    activeOpacity={0.7}
                    style={[styles.backButton, step === 0 && styles.hidden]}
                    disabled={step === 0}
                  >
                    <Text style={styles.backButtonText}>‹ Back</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.progressRow}>
                  {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.progressSegment,
                        i <= step && styles.progressSegmentActive,
                      ]}
                    />
                  ))}
                </View>

                <Text style={styles.eyebrow}>{meta.eyebrow}</Text>
                <Text style={styles.headline}>{meta.headline}</Text>
                <View style={styles.headlineBar} />

                {step === 0 && (
                  <View style={styles.field}>
                    <Text style={styles.label}>AGE</Text>
                    <View style={styles.inputShell}>
                      <TextInput
                        placeholder="24"
                        placeholderTextColor="#5A5D63"
                        style={styles.input}
                        keyboardType="number-pad"
                        maxLength={3}
                        value={age}
                        onChangeText={setAge}
                        autoFocus
                      />
                    </View>
                  </View>
                )}

                {step === 1 && (
                  <View style={styles.field}>
                    <Text style={styles.label}>HEIGHT</Text>
                    <View style={styles.row}>
                      <View style={styles.halfField}>
                        <View style={styles.inputShell}>
                          <TextInput
                            placeholder="5"
                            placeholderTextColor="#5A5D63"
                            style={styles.input}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={feet}
                            onChangeText={setFeet}
                            autoFocus
                          />
                        </View>
                        <Text style={styles.unitCaption}>FEET</Text>
                      </View>
                      <View style={styles.halfField}>
                        <View style={styles.inputShell}>
                          <TextInput
                            placeholder="9"
                            placeholderTextColor="#5A5D63"
                            style={styles.input}
                            keyboardType="number-pad"
                            maxLength={2}
                            value={inches}
                            onChangeText={setInches}
                          />
                        </View>
                        <Text style={styles.unitCaption}>INCHES</Text>
                      </View>
                    </View>
                  </View>
                )}

                {step === 2 && (
                  <View style={styles.field}>
                    <Text style={styles.label}>WEIGHT (LBS)</Text>
                    <View style={styles.inputShell}>
                      <TextInput
                        placeholder="175"
                        placeholderTextColor="#5A5D63"
                        style={styles.input}
                        keyboardType="number-pad"
                        maxLength={3}
                        value={weightLbs}
                        onChangeText={setWeightLbs}
                        autoFocus
                      />
                    </View>
                  </View>
                )}

                {step === 3 && (
                  <View style={styles.field}>
                    <Text style={styles.label}>SEX</Text>
                    <View style={styles.pillRow}>
                      {SEX_OPTIONS.map((opt) => {
                        const selected = sex === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            style={[
                              styles.pill,
                              selected && styles.pillSelected,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => setSex(opt.value)}
                          >
                            <Text
                              style={[
                                styles.pillText,
                                selected && styles.pillTextSelected,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={styles.cta}
                  activeOpacity={0.85}
                  onPress={handleContinue}
                  disabled={submitting}
                >
                  <Text style={styles.ctaText}>{ctaLabel}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipLink}
                  activeOpacity={0.7}
                  onPress={handleSkip}
                  disabled={submitting}
                >
                  <Text style={styles.skipLinkText}>{skipLabel}</Text>
                </TouchableOpacity>
              </View>
            </BlurView>

            <Text style={styles.footer}>Josh Haney 2026</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const YELLOW = "#ffd61f";
const GRAY_BORDER = "rgba(255,255,255,0.09)";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#141518" },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
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
  topRow: {
    height: 22,
    justifyContent: "center",
    marginBottom: 6,
  },
  backButton: { alignSelf: "flex-start" },
  backButtonText: {
    color: "#84878E",
    fontSize: 13,
    fontWeight: "700",
  },
  hidden: { opacity: 0 },
  progressRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 22,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 1,
    backgroundColor: GRAY_BORDER,
  },
  progressSegmentActive: {
    backgroundColor: YELLOW,
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
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  unitCaption: {
    color: "#54575D",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: "center",
  },
  pillRow: { flexDirection: "row", gap: 10 },
  pill: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: GRAY_BORDER,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  pillSelected: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },
  pillText: {
    color: "#84878E",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  pillTextSelected: {
    color: "#141518",
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
  skipLink: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  skipLinkText: {
    color: "#6A6D74",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
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
