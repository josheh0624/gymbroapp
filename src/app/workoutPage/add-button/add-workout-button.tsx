import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { GlassView } from 'expo-glass-effect';
import { Pressable, StyleSheet } from "react-native";
import liquidGlassStyles from '../../styles/liquidglass';
import { LegDay } from '../data/prebuilt-routines/ppl/leg-day';
import Workout from '../workout-model';

type Props = {
    onAddWorkout: (workout: Workout) => void;
}

export default function AddWorkoutButton({onAddWorkout}: Props) {

    return (
        
        <Pressable style={styles.container}
            onPress={() =>
                onAddWorkout({
                    id: LegDay.id,
                    name: LegDay.name,
                    day: LegDay.day,
                    exercises: LegDay.exercises,
                })
            }
        >
            <GlassView style={liquidGlassStyles.tintedGlassAddButton} glassEffectStyle="clear" />
            
            <FontAwesome6 name="plus" size={24} color="#fff"/>
            
            
        </Pressable>
        
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