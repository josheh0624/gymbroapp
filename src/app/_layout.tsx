import { useAuthStore } from "@/store/authStore";
import axios from "axios";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

axios.defaults.withCredentials = true; // Include credentials in requests

export default function RootLayout() {
  const { user, loading, setUser } = useAuthStore(); //pull user and loading state from the auth store

  useEffect(() => {
    // Fetch the current user from the backend when the app loads
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:3000/auth/me");
        setUser(res.data);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    // Show a loading indicator while checking authentication status
    return (
      <React.Fragment>
        <StatusBar style="auto" />
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" />
        </View>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <StatusBar style="auto" />
      {/* stack navigator is used to navigate between screens in the app */}
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        {/* stack protected is used to protect the screens from being accessed by unauthenticated users 
          guard = true means tabs can be accessed by authenticated users */}
        <Stack.Protected guard={user !== null}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </React.Fragment>
  );
}
