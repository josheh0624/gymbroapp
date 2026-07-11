import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
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
        name="feedPage" 
        options={{ 
            title: 'Feed', 
            tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons name={focused ? "home" : "home-outline"} size={24} color={color} />
            ),
        }} 
      />

      <Tabs.Screen 
        name="workoutPage" 
        options={{
            title: 'Workout',
            tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? "play-circle" : "play-circle-outline"} size={24} color={color} />
            ),
        }} 
      />

      <Tabs.Screen 
        name="muscle-mapPage" 
        options={{
            title: 'Muscle Map',
            tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? "body" : "body-outline"} size={24} color={color} />
            ),
        }} 
      />

      <Tabs.Screen 
        name="dietaryPage" 
        options={{
            title: 'Diet',
            tabBarIcon: ({ color, focused }) => (
                <MaterialCommunityIcons name={focused ? "silverware-fork" : "silverware-fork"} size={24} color={color} />
            ),
        }} 
      />

      <Tabs.Screen 
        name="accountPage" 
        options={{
            title: 'Account',
            tabBarIcon: ({ color, focused }) => (
                <FontAwesome6 name={focused ? "user-large" : "user"} size={24} color={color} />
            ),
        }} 
      />
    </Tabs>
  )
}