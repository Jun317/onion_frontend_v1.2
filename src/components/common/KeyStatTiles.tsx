import { StyleSheet, Text, View } from 'react-native';

import type { KeyStat } from '@/data/types';
import { font, radius, spacing, typography, useTheme } from '@/theme';

interface Props {
  stats: KeyStat[];
  size?: 'md' | 'sm'; // sm = 스테디 스코어 3타일용
}

/**
 * 핵심 수치 타일 행 — 값은 백엔드가 완성한 문자열 그대로 (프론트 계산 금지).
 * 방향색: 상승=빨강 · 하락=파랑 (국내 관례) · 보합=기본 잉크.
 */
export function KeyStatTiles({ stats, size = 'md' }: Props) {
  const { theme } = useTheme();
  if (!stats || stats.length === 0) return null;

  const valueColor = (d: KeyStat['direction']) =>
    d === 'up' ? theme.up : d === 'down' ? theme.down : theme.text;

  return (
    <View style={styles.row}>
      {stats.map((s, i) => (
        <View
          key={i}
          style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.label, { color: theme.textMuted }]} numberOfLines={2}>
            {s.label}
          </Text>
          <Text
            style={[size === 'md' ? styles.value : styles.valueSm, { color: valueColor(s.direction) }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            {s.direction === 'up' ? '▲ ' : s.direction === 'down' ? '▼ ' : ''}
            {s.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    gap: 3,
  },
  label: { ...typography.micro },
  value: { fontSize: 19, ...font(800), fontVariant: ['tabular-nums'] },
  valueSm: { fontSize: 15, ...font(800), fontVariant: ['tabular-nums'] },
});
