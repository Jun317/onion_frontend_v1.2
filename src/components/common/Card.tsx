import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { cardShadow, radius, spacing, useTheme } from '@/theme';

/**
 * 공용 카드 면 — 흰 면 + 낮은 확산 그림자 (iOS 감성, v4 에서 헤어라인 → 그림자 전환).
 * radius 16 · padding 16 · surface 배경. 카드형 UI 는 전부 이걸 쓴다.
 */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.surface }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.md,
    ...cardShadow,
  },
});
