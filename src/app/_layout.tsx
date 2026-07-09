import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    // stack navigator is used to navigate between screens in the app
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  )
}
