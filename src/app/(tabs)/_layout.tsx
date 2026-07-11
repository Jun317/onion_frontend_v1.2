import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { font, useTheme } from '@/theme';

function TabEmoji({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 19, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

/** 탭 3개 — ⚡ 이슈 · 📚 스테디 · 👤 마이. 활성 탭 = accent 보라 */
export default function TabLayout() {
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.hairline },
        tabBarLabelStyle: { fontSize: 12, ...font(600) },
        sceneStyle: { backgroundColor: theme.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '이슈',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="⚡" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="steady"
        options={{
          title: '스테디',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: '마이',
          tabBarIcon: ({ focused }) => <TabEmoji emoji="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
