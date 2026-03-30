import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, NotoSansSC_400Regular, NotoSansSC_700Bold } from '@expo-google-fonts/noto-sans-sc';
import { runMigrations } from '../storage/migrations';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';
import { pullAll } from '../storage/cloudSync';
import AuthScreen from '../screens/AuthScreen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colors } = useTheme();
  const [migrationsRan, setMigrationsRan] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [fontsLoaded] = useFonts({
    NotoSansSC_400Regular,
    NotoSansSC_700Bold,
  });

  useEffect(() => {
    runMigrations().then(() => setMigrationsRan(true));
  }, []);

  // Check for an existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      setAuthChecked(true);
      if (uid) pullAll(uid).catch(() => {});
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (fontsLoaded && migrationsRan && authChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, migrationsRan, authChecked]);

  if (!fontsLoaded || !migrationsRan || !authChecked) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  if (!userId) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <AuthScreen
          onAuth={uid => {
            pullAll(uid).catch(() => {});
            setUserId(uid);
          }}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
