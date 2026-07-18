import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { GlassView } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

const ACTIVE_COLOR = '#ff0000';
const INACTIVE_COLOR = "#fff";

function GlassTabBar(props: BottomTabBarProps) {
  const { state, descriptors, navigation } = props;
  return (
    <GlassView style={styles.tabBar} glassEffectStyle="regular">
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabItem}>
              {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
            </Pressable>
          );
        })}
      </View>
    </GlassView>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...(props as unknown as BottomTabBarProps)} />}
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
            headerTitleAlign: "left",

            headerTitleStyle: {
                fontSize: 30,
                fontWeight: "bold",
            },
            tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? "play-circle" : "play-circle-outline"} size={24} color={color}/>
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

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },
  row: {
    flex: 1,
    flexDirection: "row",
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});