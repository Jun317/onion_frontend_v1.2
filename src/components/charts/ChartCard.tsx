import { StyleSheet, Text, View } from 'react-native';

import type { Visual } from '@/data/types';
import { spacing, useTheme } from '@/theme';
import { periodRange } from '@/utils/format';

import { BarGroupChart } from './BarGroupChart';
import { LineChart } from './LineChart';
import { NumberCard } from './NumberCard';
import { SimpleBarChart } from './SimpleBarChart';

interface Props {
  visual: Visual; // normalizeVisual 을 통과한 데이터만 받는다 (kind === chart)
  width: number;
}

/** 라인 차트 최소 포인트 — 미만이면 숫자 카드 폴백 (2점 직선을 추세로 위장 금지) */
export const MIN_LINE_POINTS = 5;

/** 차트 프레임 — 제목·출처·실데이터 기간·읽는 법을 항상 함께 표기 */
export function ChartCard({ visual, width }: Props) {
  const { theme } = useTheme();
  const innerWidth = width - spacing.md * 2;

  let body = null;
  let range = '';
  const numeric = (visual.series ?? []).filter((p) => typeof p.v === 'number');
  if (visual.series_multi && visual.series_multi.length > 0) {
    // v4 멀티 시리즈 (범례·점선·null 갭)
    body = (
      <LineChart
        seriesMulti={visual.series_multi}
        unit={visual.unit}
        step={visual.chart === 'step'}
        width={innerWidth}
      />
    );
    range = periodRange(visual.series_multi[0].series);
  } else if (visual.chart === 'bar' && visual.series && visual.series.length > 0) {
    // v4 단일 지표 막대 (null 슬롯 보존)
    body = <SimpleBarChart series={visual.series} unit={visual.unit} width={innerWidth} />;
  } else if (visual.groups && visual.groups.length > 0) {
    body = <BarGroupChart groups={visual.groups} width={innerWidth} />;
  } else if (visual.series && numeric.length >= MIN_LINE_POINTS) {
    body = (
      <LineChart
        series={visual.series}
        markers={visual.markers}
        colorRole={visual.color_role}
        unit={visual.unit}
        step={visual.chart === 'step'}
        width={innerWidth}
      />
    );
    // 기간 캡션은 제목이 아니라 실데이터 범위에서 산출 ("최근 6개월" 위장 방지)
    range = periodRange(visual.series);
  } else if (visual.series && numeric.length >= 1) {
    body = <NumberCard series={visual.series} unit={visual.unit} />;
  }
  if (!body) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, width }]}>
      <Text style={[styles.title, { color: theme.text }]}>{visual.title}</Text>
      {body}
      {!!visual.note && <Text style={[styles.note, { color: theme.textMuted }]}>{visual.note}</Text>}
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
  note: { fontSize: 11, lineHeight: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  source: { fontSize: 11, flexShrink: 1 },
});
