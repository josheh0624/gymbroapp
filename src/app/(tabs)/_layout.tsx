import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { GlassView } from "expo-glass-effect";
import { Tabs, usePathname } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import AddWorkoutButton from "../workoutPage/add-button/add-workout-button";

const ACTIVE_COLOR = "#ffd61f";
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
  const pathname = usePathname();
  const showAddButton = pathname === "/";

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => (
          <GlassTabBar {...(props as unknown as BottomTabBarProps)} />
        )}
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
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "barbell" : "barbell-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="muscle-mapPage"
          options={{
            title: "Muscle Map",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "body" : "body-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="accountPage"
          options={{
            title: "Account",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <FontAwesome6 name="circle-user" size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      {showAddButton && (
        <View style={styles.addButtonWrap} pointerEvents="box-none">
          <AddWorkoutButton />
        </View>
      )}
    </View>
  );
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
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonWrap: {
    position: "absolute",
    right: 20,
    bottom: 108,
    zIndex: 10,
    elevation: 10,
  },
});
