import { StyleSheet, Text, View } from 'react-native';

import type { Visual } from '@/data/types';
import { spacing, useTheme } from '@/theme';
import { periodRange } from '@/utils/format';

import { BarGroupChart } from './BarGroupChart';
import { LineChart } from './LineChart';
import { NumberCard } from './NumberCard';

interface Props {
  visual: Visual; // normalizeVisual 을 통과한 데이터만 받는다
  width: number;
}

/** 라인 차트 최소 포인트 — 미만이면 숫자 카드 폴백 (2점 직선을 추세로 위장 금지) */
export const MIN_LINE_POINTS = 5;

/** 차트 프레임 — 제목·출처·실데이터 기간을 항상 함께 표기 */
export function ChartCard({ visual, width }: Props) {
  const { theme } = useTheme();
  const innerWidth = width - spacing.md * 2;

  let body = null;
  let range = '';
  if (visual.groups && visual.groups.length > 0) {
    body = <BarGroupChart groups={visual.groups} width={innerWidth} />;
  } else if (visual.series && visual.series.length >= MIN_LINE_POINTS) {
    body = (
      <LineChart
        series={visual.series}
        unit={visual.unit}
        step={visual.chart === 'step'}
        width={innerWidth}
      />
    );
    // 기간 캡션은 제목이 아니라 실데이터 범위에서 산출 ("최근 6개월" 위장 방지)
    range = periodRange(visual.series);
  } else if (visual.series && visual.series.length >= 1) {
    body = <NumberCard series={visual.series} unit={visual.unit} />;
  }
  if (!body) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, width }]}>
      <Text style={[styles.title, { color: theme.text }]}>{visual.title}</Text>
      {body}
      {(!!visual.source || !!range) && (
        <View style={styles.metaRow}>
          {!!visual.source && (
            <Text style={[styles.source, { color: theme.textMuted }]}>출처: {visual.source}</Text>
          )}
          {!!range && <Text style={[styles.source, { color: theme.textMuted }]}>{range}</Text>}
        </View>
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
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  source: { fontSize: 11 },
});
