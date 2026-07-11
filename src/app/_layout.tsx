import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { GlossaryProvider } from '@/components/glossary/GlossaryContext';
import { PrefsProvider } from '@/lib/store';
import { fontSources, useTheme } from '@/theme';

// Pretendard 로딩이 끝날 때까지 스플래시 유지
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { theme } = useTheme();
  const [fontsLoaded, fontError] = useFonts(fontSources);

  useEffect(() => {
    // 폰트 로드 실패 시에도 시스템 폰트로 앱은 열어준다
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <PrefsProvider>
      <GlossaryProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="issue/[id]" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="steady/[id]" options={{ animation: 'fade', gestureEnabled: false }} />
          <Stack.Screen name="my/read" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </GlossaryProvider>
    </PrefsProvider>
  );
}
