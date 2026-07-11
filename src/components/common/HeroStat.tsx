import { StyleSheet, Text, View } from 'react-native';

import type { HeadlineStat } from '@/data/types';
import { font, spacing, typography, useTheme } from '@/theme';

import { DeltaPill } from './DeltaPill';

/**
 * 히어로 대형 스탯 — 값 40/800(tabular) + 단위 20 + 델타 필 + "직전 …".
 * 라벨 줄 없음 (제목과 중복이라 제거 확정).
 */
export function HeroStat({ stat }: { stat: HeadlineStat }) {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: theme.text }]}>
          {stat.value}
          <Text style={[styles.unit, { color: theme.textSecondary }]}> {stat.unit}</Text>
        </Text>
        {!!stat.delta_text && <DeltaPill text={stat.delta_text} direction={stat.direction} size="md" />}
      </View>
      {!!stat.prev_text && (
        <Text style={[styles.prev, { color: theme.textMuted }]}>{stat.prev_text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { ...typography.heroStat },
  unit: { fontSize: 20, ...font(700) },
  prev: { fontSize: 12, ...font(400) },
});
