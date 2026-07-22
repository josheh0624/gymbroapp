import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import AddCustomButton from "./add-custom-button";
import PrebuiltWorkoutList from "./prebuilt-workout-list";

export default function AddWorkoutNAV() {

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Create A Routine',
                    headerTitleAlign: "left",
                    headerBackButtonDisplayMode: "minimal",
                    headerStyle: {
                        backgroundColor: "#25292e",
                    },
                    headerShadowVisible: false,
                    headerTintColor: "#fff",

                    headerTitleStyle: {
                        fontSize: 30,
                        fontWeight: "bold",
                    },
                }}
            />
            
            <View style={styles.container}>
                <PrebuiltWorkoutList />
            </View>
            <View>
                <AddCustomButton />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#25292e',
        alignItems: "center",
    },
})