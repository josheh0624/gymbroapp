import { ThemeColors } from "@/styles/appStyles";
import { BlurView } from "expo-blur";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Body, { type ExtendedBodyPart, type Slug } from "react-native-body-highlighter";
import { WeeklyMuscleHit } from "../hooks/useWeeklyMuscleActivity";

const PRIMARY_COLOR = "#FF4D5E"; // Vivid Coral/Red for primary (2+ hits)
const SECONDARY_COLOR = "#FFB800"; // Vibrant Gold for secondary (1 hit)
const BODY_BASE = "#8E9298"; // Untargeted neutral figure fill
const BODY_SCALE = 1.4;
const HEAD_CROP_HEIGHT = 60;

const BODY_PART_SLUGS: Record<string, Slug> = {
  chest: "chest",
  back: "upper-back",
  lats: "upper-back",
  traps: "trapezius",
  shoulders: "deltoids",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearm",
  quads: "quadriceps",
  hamstrings: "hamstring",
  calves: "calves",
  glutes: "gluteal",
  abs: "abs",
  obliques: "obliques",
};

function normalizeGroup(name: string): string {
  const lower = name.toLowerCase().trim();
  if (lower.includes("chest") || lower.includes("pec")) return "chest";
  if (lower.includes("lat")) return "lats";
  if (lower.includes("trap")) return "traps";
  if (lower.includes("back")) return "back";
  if (lower.includes("shoulder") || lower.includes("delt")) return "shoulders";
  if (lower.includes("bicep")) return "biceps";
  if (lower.includes("tricep")) return "triceps";
  if (lower.includes("forearm")) return "forearms";
  if (lower.includes("quad")) return "quads";
  if (lower.includes("hamstring")) return "hamstrings";
  if (lower.includes("calf") || lower.includes("calve")) return "calves";
  if (lower.includes("glute")) return "glutes";
  if (lower.includes("ab") || lower.includes("core")) return "abs";
  if (lower.includes("oblique")) return "obliques";
  return lower;
}

function intensityForRegion(
  muscleName: string,
  hits: WeeklyMuscleHit[],
): number {
  const normTarget = normalizeGroup(muscleName);
  const found = hits.find((h) => normalizeGroup(h.muscleGroupName) === normTarget);
  if (!found || found.timesHit === 0) return 0;
  return found.timesHit >= 2 ? 2 : 1;
}

interface MuscleAnatomyViewerProps {
  data: WeeklyMuscleHit[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  colors: ThemeColors;
  isLight: boolean;
}

export function MuscleAnatomyViewer({
  data,
  loading,
  error,
  refetch,
  colors,
  isLight,
}: MuscleAnatomyViewerProps) {
  const [mapSide, setMapSide] = useState<"front" | "back">("front");

  const bodyData: ExtendedBodyPart[] = data.flatMap((d) => {
    const slug = BODY_PART_SLUGS[normalizeGroup(d.muscleGroupName).toLowerCase()];
    if (!slug) return [];
    return [
      {
        slug,
        intensity: intensityForRegion(normalizeGroup(d.muscleGroupName), data),
      },
    ];
  });

  return (
    <BlurView
      intensity={isLight ? 20 : 15}
      tint={isLight ? "light" : "dark"}
      style={[
        styles.glassCard,
        {
          backgroundColor: isLight
            ? "rgba(255,255,255,0.3)"
            : "rgba(0,0,0,0.2)",
        },
      ]}
    >
      {error ? (
        <View style={styles.errorState}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <Pressable onPress={refetch} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.mapContainer}>
          {loading && (
            <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
              <ActivityIndicator size="large" color={colors.text} />
            </View>
          )}

          {/* Front / Back Toggle */}
          <BlurView
            intensity={isLight ? 40 : 20}
            tint={isLight ? "extraLight" : "dark"}
            style={styles.mapToggle}
          >
            <Pressable
              style={[
                styles.mapToggleButton,
                mapSide === "front" && styles.mapToggleButtonActive,
              ]}
              onPress={() => setMapSide("front")}
            >
              <Text
                style={[
                  styles.mapToggleText,
                  mapSide === "front" && styles.mapToggleTextActive,
                ]}
              >
                Front
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.mapToggleButton,
                mapSide === "back" && styles.mapToggleButtonActive,
              ]}
              onPress={() => setMapSide("back")}
            >
              <Text
                style={[
                  styles.mapToggleText,
                  mapSide === "back" && styles.mapToggleTextActive,
                ]}
              >
                Back
              </Text>
            </Pressable>
          </BlurView>

          {/* Anatomical Figure */}
          <View style={styles.bodyCropBox}>
            <View style={{ transform: [{ translateY: -HEAD_CROP_HEIGHT }] }}>
              <Body
                data={bodyData}
                scale={BODY_SCALE}
                hiddenParts={["head", "hair", "neck"]}
                side={mapSide}
                colors={[BODY_BASE, SECONDARY_COLOR, PRIMARY_COLOR]}
                border={colors.textMuted}
                gender="male"
                defaultFill={BODY_BASE}
              />
            </View>
          </View>
        </View>
      )}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  glassCard: {
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mapContainer: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    borderRadius: 60,
  },
  mapToggle: {
    flexDirection: "row",
    borderRadius: 20,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  mapToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  mapToggleButtonActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  mapToggleText: {
    color: "#8E9298",
    fontSize: 13,
    fontWeight: "700",
  },
  mapToggleTextActive: {
    color: "#FFFFFF",
  },
  bodyCropBox: {
    height: 510,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  errorState: {
    padding: 32,
    alignItems: "center",
  },
  errorText: {
    fontSize: 14,
    marginBottom: 12,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FF4D5E",
    borderRadius: 12,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
});
