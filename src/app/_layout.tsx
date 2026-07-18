import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {

  const isLoggedIn = true; // Replace with your actual authentication logic

  return (
    <React.Fragment>
      <StatusBar style="auto" />
        { /* stack navigator is used to navigate between screens in the app */ }
        <Stack>
          {/* stack protected is used to protect the screens from being accessed by unauthenticated users 
          guard = true means tabs can be accessed by authenticated users */}
          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack.Protected>
          <Stack.Protected guard={!isLoggedIn}>
          </Stack.Protected>
          
        </Stack>
    </React.Fragment>
    
  )
}
