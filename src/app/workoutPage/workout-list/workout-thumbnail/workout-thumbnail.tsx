import liquidGlassStyles from "@/app/styles/liquidglass";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import Workout from "../../../models/workout-model";

interface Props{
    workout: Workout;
}

export default function WorkoutThumbnail({workout}: Props) {

    return(
            <Pressable  style={styles.workoutCard} onPress={() =>
                router.push({
                    pathname: "../../workout-thumbnail/[id]",
                    params: {
                        id: workout.id,
                    }
                })
            }>
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
    text: {
        color: '#fff',
        top: 0,
        padding: 20,
        fontSize: 24,
        fontWeight: 600,
    }
})