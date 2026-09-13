import { supabase } from "@/api/supabase";
import { useAuthStore, SafeUser } from "@/store/authStore";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const { user, loading, setUser, setLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function getProfile(userId: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setUser(data as SafeUser);
      } else {
        setUser(null);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isMounted) {
        getProfile(session.user.id).finally(() => setLoading(false));
      } else if (isMounted) {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          getProfile(session.user.id);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const inProtectedGroup = segments[0] === '(tabs)' || segments[0] === 'workoutPage';
    
    if (!user && inProtectedGroup) {
      // Redirect to login if not authenticated
      router.replace('/routes/login');
    }
    // Note: We let the individual auth screens (login, register, setup) handle their own redirects 
    // when the user state changes, so we don't accidentally interrupt the onboarding flow!
  }, [user, loading, segments]);

  if (loading) {
    return (
      <React.Fragment>
        <StatusBar style="auto" />
        <View
          style={{ flex: 1, backgroundColor: "#141518", justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#ffd61f" />
        </View>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="routes/login" options={{ headerShown: false }} />
        <Stack.Screen name="routes/onboarding/register" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workoutPage/workoutPage" options={{ headerShown: false }} />
      </Stack>
    </React.Fragment>
  );
}
