import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AddToRoutine from "./add-to-routine-button";

interface RoutineListItem {
  id: string;
  name: string;
  workout_count: number;
}

interface Props {
  routine: RoutineListItem;
}

const CARD_RADIUS = 20;

export default function PrebuiltWorkoutThumbnail({ routine }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.workoutCard, pressed && styles.pressed]}
    >
      <GlassView
        style={styles.glassBase}
        glassEffectStyle="regular"
        tintColor="#141518CC"
        isInteractive
      />

      <LinearGradient
        colors={["transparent", "rgba(10,10,12,0.85)"]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 0, y: 1 }}
        style={styles.scrim}
      />

      <View style={styles.countBadge}>
        <FontAwesome6 name="dumbbell" size={10} color="#ffd61f" />
        <Text style={styles.countText}>{routine.workout_count}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.text} numberOfLines={1}>
          {routine.name}
        </Text>
      </View>

      <View style={styles.addButtonWrapper}>
        <AddToRoutine routineId={routine.id} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  workoutCard: {
    width: "90%",
    height: 160,
    alignSelf: "center",
    marginBottom: 14,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: "#141518", // solid fallback so it never flashes/shows a hole pre-mount or on unsupported devices
  },
  pressed: {
    transform: [{ scale: 0.98 }], // no opacity here — opacity on a GlassView's parent stops the glass effect from rendering
  },
  glassBase: {
    ...StyleSheet.absoluteFill,
    borderRadius: CARD_RADIUS, // set directly on the glass view itself, not inherited from the parent
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    borderRadius: CARD_RADIUS,
  },
  countBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  textContainer: {
    position: "absolute",
    bottom: 16,
    left: 18,
    right: 64,
  },
  text: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  addButtonWrapper: {
    position: "absolute",
    bottom: 14,
    right: 14,
  },
});
