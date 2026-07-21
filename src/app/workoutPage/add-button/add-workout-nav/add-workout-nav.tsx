import { StyleSheet, View } from "react-native";
import PrebuiltWorkoutList from "./prebuilt-workout-list";


export default function AddWorkoutNAV() {

    return (
        <View style={styles.container}>
            <PrebuiltWorkoutList />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#25292e',
        alignItems: "center",
    },
})