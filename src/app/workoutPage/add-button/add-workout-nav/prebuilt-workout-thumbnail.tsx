import WorkoutRoutine from "@/app/models/workout-routine-model";
import liquidGlassStyles from "@/app/styles/liquidglass";
import { GlassView } from "expo-glass-effect";
import { Pressable, StyleSheet, Text } from "react-native";

interface Props {
    routine: WorkoutRoutine;
}

export default function PrebuiltWorkoutThumbnail({routine}: Props) {
    return(
            <Pressable  style={styles.workoutCard}>
                <GlassView style={liquidGlassStyles.tintedGlassThumbnail} glassEffectStyle="clear" />
                <Text style={styles.text}>{routine.name}</Text>
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
    text: {
        color: '#fff',
        top: 0,
        padding: 20,
        fontSize: 24,
        fontWeight: 600,
    }
})