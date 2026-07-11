import { StyleSheet, Text, View } from "react-native";

export default function MuscleMapScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Muscle Screen</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#25292e',
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        color: "#fff",
    }
});