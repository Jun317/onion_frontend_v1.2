import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { GlossaryProvider } from '@/components/glossary/GlossaryContext';
import { useTheme } from '@/theme';

export default function RootLayout() {
  const { theme, scheme } = useTheme();
  return (
    <GlossaryProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="issue/[id]" options={{ animation: 'fade', gestureEnabled: false }} />
      </Stack>
    </GlossaryProvider>
  );
}
