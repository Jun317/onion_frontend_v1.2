import { StyleSheet, Text, View } from 'react-native';

import type { KeyStat } from '@/data/types';
import { cardShadow, font, radius, spacing, typography, useTheme } from '@/theme';

interface Props {
  stats: KeyStat[];
  size?: 'md' | 'sm'; // sm = 스테디 스코어 3타일용
}

/**
 * 핵심 수치 타일 행 — 라벨(수치의 의미)을 위에 크고 선명하게, 값을 아래 크게.
 * 값은 백엔드가 완성한 문자열 그대로 (프론트 계산 금지).
 * 방향색: 상승=빨강 · 하락=파랑 (국내 관례) · 보합=기본 잉크.
 */
export function KeyStatTiles({ stats, size = 'md' }: Props) {
  const { theme } = useTheme();
  if (!stats || stats.length === 0) return null;

  const valueColor = (d: KeyStat['direction']) =>
    d === 'up' ? theme.up : d === 'down' ? theme.down : theme.text;
  const md = size === 'md';

  return (
    <View style={styles.row}>
      {stats.map((s, i) => (
        <View
          key={i}
          style={[md ? styles.tile : styles.tileSm, { backgroundColor: theme.surface }]}>
          <Text
            style={[md ? styles.label : styles.labelSm, { color: theme.textSecondary }]}
            numberOfLines={2}>
            {s.label}
          </Text>
          <Text
            style={[md ? styles.value : styles.valueSm, { color: valueColor(s.direction) }]}
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
  row: { flexDirection: 'row', gap: spacing.sm + 2 },
  tile: {
    flex: 1,
    borderRadius: radius.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
    justifyContent: 'space-between',
    minHeight: 96,
    ...cardShadow,
  },
  tileSm: {
    flex: 1,
    borderRadius: radius.control,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    gap: 3,
    ...cardShadow,
  },
  // 수치의 의미 — 값보다 먼저 읽히도록 크고 선명하게
  label: { fontSize: 13.5, lineHeight: 19, ...font(600) },
  labelSm: { ...typography.micro },
  value: { fontSize: 22, ...font(800), fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
  valueSm: { fontSize: 15, ...font(800), fontVariant: ['tabular-nums'] },
});
