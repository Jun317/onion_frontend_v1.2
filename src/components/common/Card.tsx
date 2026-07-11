import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { radius, spacing, useTheme } from '@/theme';

/**
 * 공용 카드 면 — 면 분리는 배경색 + 1px 헤어라인만 (box-shadow 금지).
 * radius 16 · padding 16 · surface 배경. 카드형 UI 는 전부 이걸 쓴다.
 */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
});
