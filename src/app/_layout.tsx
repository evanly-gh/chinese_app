import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, NotoSansSC_400Regular, NotoSansSC_700Bold } from '@expo-google-fonts/noto-sans-sc';
import { runMigrations } from '../storage/migrations';
import { Colors } from '../theme/colors';
import { useColorScheme } from '../hooks/useColorScheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [migrationsRan, setMigrationsRan] = useState(false);

  const [fontsLoaded] = useFonts({
    NotoSansSC_400Regular,
    NotoSansSC_700Bold,
  });

  useEffect(() => {
    runMigrations().then(() => setMigrationsRan(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && migrationsRan) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, migrationsRan]);

  if (!fontsLoaded || !migrationsRan) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
