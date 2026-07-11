import { StyleSheet, Text, View } from 'react-native';

import type { StatDirection } from '@/data/types';
import { font, radius, tint, useTheme } from '@/theme';

interface Props {
  text: string; // 백엔드가 완성한 표기 문자열 ("-0.13%p")
  direction: StatDirection;
  size?: 'sm' | 'md';
}

/** 증감 필 — 방향색 11% 틴트 배경 + 방향색 글자. 상승=빨강, 하락=파랑 고정 */
export function DeltaPill({ text, direction, size = 'sm' }: Props) {
  const { theme } = useTheme();
  const color =
    direction === 'up' ? theme.up : direction === 'down' ? theme.down : theme.textMuted;
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '—';
  return (
    <View style={[styles.pill, { backgroundColor: tint(color, 0.11) }]}>
      <Text style={[styles.text, size === 'md' && styles.textMd, { color }]}>
        {arrow} {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, ...font(700) },
  textMd: { fontSize: 14 },
});
