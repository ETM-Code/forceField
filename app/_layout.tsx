import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { LogBox } from 'react-native'; // Import LogBox to suppress warnings and errors

import { useColorScheme } from '@/hooks/useColorScheme';
import { NativeWindStyleSheet } from "nativewind";
import { SensorDataProvider } from '@/context/SensorDataContext';

NativeWindStyleSheet.setOutput({
  default: "native",
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Ignore all logs (warnings and errors)
LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SensorDataProvider>
        <Stack >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="teamPage" options={{ headerShown: false }} />
          <Stack.Screen name="StartSessionPage" options={{ headerShown: false }} />
          <Stack.Screen name="LoadSessionPage" options={{ headerShown: false }} />
          <Stack.Screen name="teamMemberDetail"/>
        </Stack>
      </SensorDataProvider>
    </ThemeProvider>
  );
}
