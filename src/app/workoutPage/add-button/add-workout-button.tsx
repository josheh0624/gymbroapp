import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { GlassView } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from "react-native";
import liquidGlassStyles from '../../styles/liquidglass';

export default function AddWorkoutButton() {
    //
    //route to add workout nav
    //

    const router = useRouter();

    return (
        <>
            <Pressable style={styles.container}
                onPress={() => 
                        router.push("/workoutPage/add-workout-nav/add-workout-nav")
                }
            >
                <GlassView style={liquidGlassStyles.tintedGlassAddButton} glassEffectStyle="clear" />
                
                <FontAwesome6 name="plus" size={24} color="#fff"/>
            </Pressable>
        </>
    );
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
});