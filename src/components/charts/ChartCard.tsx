import { StyleSheet, Text, View } from 'react-native';

import type { Visual } from '@/data/types';
import { spacing, useTheme } from '@/theme';

import { BarGroupChart } from './BarGroupChart';
import { LineChart } from './LineChart';

interface Props {
  visual: Visual; // normalizeVisual 을 통과한 데이터만 받는다
  width: number;
}

/** 차트 프레임 — 제목·출처를 항상 함께 표기 */
export function ChartCard({ visual, width }: Props) {
  const { theme } = useTheme();
  const innerWidth = width - spacing.md * 2;

  let body = null;
  if (visual.groups && visual.groups.length > 0) {
    body = <BarGroupChart groups={visual.groups} width={innerWidth} />;
  } else if (visual.series && visual.series.length >= 2) {
    body = (
      <LineChart
        series={visual.series}
        unit={visual.unit}
        step={visual.chart === 'step'}
        width={innerWidth}
      />
    );
  }
  if (!body) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, width }]}>
      <Text style={[styles.title, { color: theme.text }]}>{visual.title}</Text>
      {body}
      {!!visual.source && (
        <Text style={[styles.source, { color: theme.textMuted }]}>출처: {visual.source}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
  },
  title: { fontSize: 15, fontWeight: '700' },
  source: { fontSize: 11 },
});
