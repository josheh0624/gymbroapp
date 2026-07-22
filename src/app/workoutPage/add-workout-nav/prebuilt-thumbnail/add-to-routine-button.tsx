import WorkoutRoutine from "@/app/models/workout-routine-model";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

interface Props {
    routine: WorkoutRoutine;
}

export default function AddToRoutine({routine}: Props) {
    // when button is pressed 
    // navigates to workoutPage
    //passes routine data back to workoutPage
    
    const handleAddWorkout = () => {
        // .replace replaces current screen instead of adding another to stack
        router.replace({
            pathname: "/(tabs)/workoutPage",
            params: {
                addedRoutine: JSON.stringify(routine), //sends routine data back as string to send through nav safely
            },
        });
    };

    return (
        <>
            <Pressable style={styles.container} onPress={handleAddWorkout}>
                <GlassView style={styles.tintedGlassAddButton} glassEffectStyle="clear" />
                <FontAwesome6 name="plus" size={24} color="#fff"/>
            </Pressable>
        </>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30,
        height: 40,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
    },
    tintedGlassAddButton: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
})