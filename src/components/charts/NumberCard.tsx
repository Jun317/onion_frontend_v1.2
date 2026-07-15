import { StyleSheet, Text, View } from 'react-native';

import { DeltaPill } from '@/components/common/DeltaPill';
import type { SeriesPoint } from '@/data/types';
import { font, spacing, useTheme } from '@/theme';
import { formatNumber, periodLabel } from '@/utils/format';

interface Props {
  series: SeriesPoint[]; // 1개 이상
  unit?: string;
}

/**
 * 데이터 포인트가 적을 때(<5)의 차트 폴백 — 점 두 개짜리 직선을 "추이"처럼
 * 보여주는 대신 최신값 + 증감 필 + 사유 한 줄로 정직하게 표기한다 (차트 문법 준수).
 */
export function NumberCard({ series, unit = '' }: Props) {
  const { theme } = useTheme();
  if (series.length === 0) return null;

  const last = series[series.length - 1];
  const first = series[0];
  const delta = last.v - first.v;
  const direction = delta > 0 ? ('up' as const) : delta < 0 ? ('down' as const) : ('flat' as const);
  const deltaText = `${formatNumber(Math.abs(delta))}${unit}`;
  const when = periodLabel(last.t);

  return (
    <View style={styles.container}>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: theme.text }]}>
          {formatNumber(last.v)}
          <Text style={[styles.unit, { color: theme.textSecondary }]}>{unit}</Text>
        </Text>
        {series.length >= 2 && delta !== 0 && <DeltaPill text={deltaText} direction={direction} size="md" />}
      </View>
      <Text style={[styles.note, { color: theme.textMuted }]}>
        {when ? `${when} 기준 · ` : ''}데이터가 적어 그래프 대신 숫자로 보여드려요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs, paddingVertical: spacing.sm },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { fontSize: 32, ...font(800), fontVariant: ['tabular-nums'] },
  unit: { fontSize: 18, ...font(600) },
  note: { fontSize: 11, ...font(400) },
});
