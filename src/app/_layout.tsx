import axios from "axios";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

axios.defaults.withCredentials = true; // Include credentials in requests

export default function RootLayout() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:3000/auth/me");
        setUser(res.data);
      } catch (err) {
        setError("Failed to fetch user data");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
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
