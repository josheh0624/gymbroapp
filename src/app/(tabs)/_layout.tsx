import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#ffd33d",
        tabBarInactiveTintColor: "#fff",
        headerStyle: {
            backgroundColor: "#25292e",
        },
        headerShadowVisible: false,
        headerTintColor: "#fff",
        tabBarStyle: {
            backgroundColor: "#25292e",
        },
    }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
            title: 'Home', 
            tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons name={focused ? "home" : "home-outline"} size={24} color={color} />
            ),
        }} 
      />
      <Tabs.Screen 
        name="about" 
        options={{
            title: 'About',
            tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons name={focused ? "information" : "information-outline"} size={24} color={color} />
            ),
        }} 
      />
    </Tabs>
  )
}