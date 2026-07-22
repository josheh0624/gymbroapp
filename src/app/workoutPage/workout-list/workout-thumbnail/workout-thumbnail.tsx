import liquidGlassStyles from "@/app/styles/liquidglass";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import Workout from "../../../models/workout-model";

interface Props{
    workout: Workout;
    selectedWeekdayID: number;
    visible: boolean;
}

export default function WorkoutThumbnail({workout, selectedWeekdayID, visible}: Props) {
    const normalizeWeekday = (value: number | string) => {
        const normalizedValue = Number(value);
        return normalizedValue === 0 ? 7 : normalizedValue;
    };

    return (
        <Pressable
            style={[styles.workoutCard, !visible && styles.hidden]}
            pointerEvents={visible ? "auto" : "none"}
            onPress={() =>
                router.push({
                    pathname: "../../workout-thumbnail/[id]",
                    params: { id: workout.id },
                })
            }
        >
            <GlassView style={liquidGlassStyles.tintedGlassThumbnail} glassEffectStyle="clear" />
            <Text style={styles.text}>{workout.name}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    workoutCard: {
        width: "90%",
        height: 160,
        alignSelf: "center",
        marginBottom: 10,
    },
    hidden: {
        display: "none",
    },
    text: {
        color: "#fff",
        top: 0,
        padding: 20,
        fontSize: 24,
        fontWeight: 600,
    },
});