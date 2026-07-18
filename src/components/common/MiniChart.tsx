import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { linePath, niceScale, stepPath, xAt, yAt, type Rect } from '@/components/charts/chartMath';
import type { SeriesPoint, Visual } from '@/data/types';
import { font, spacing, useTheme } from '@/theme';
import { formatNumber, periodLabel } from '@/utils/format';

interface Props {
  visual: Visual;
  width: number;
  height?: number;
}

/**
 * 미니멀 차트 (히어로·스테디 개요용) — 축·그리드 없음.
 * 끝점 도트 + 값 라벨(accent), 첫/끝 기간 라벨 10px, 아래 "제목 · 출처" 한 줄.
 * 상세 차트(ChartCard)는 더 알아보기 시트에서.
 */
export function MiniChart({ visual, width, height = 120 }: Props) {
  const { theme } = useTheme();

  // 표·타임라인·막대 kind 는 히어로 미니차트로 부적합 — 상세의 원본(TableCard 등)에서만.
  if ((visual.kind && visual.kind !== 'chart') || visual.chart === 'bar') return null;

  // 단일 series 우선 → v4 멀티 시리즈의 첫 시리즈 → (실적 그룹형) 첫 그룹.
  // 포인트 5개 미만은 "추세선 위장"이 되므로 히어로에서는 그리지 않는다
  // (상세 시트의 ChartCard 가 숫자 카드로 폴백해 값 자체는 전달된다).
  const raw: SeriesPoint[] | undefined =
    visual.series ?? visual.series_multi?.[0]?.series ?? visual.groups?.[0]?.series;
  // null 갭 제외한 실측 포인트만 (미니 차트는 갭 렌더 대신 압축)
  const series = (raw ?? []).filter(
    (p): p is SeriesPoint & { v: number } => typeof p.v === 'number' && isFinite(p.v),
  );
  if (series.length < 5 || width <= 0) return null;

  const plot: Rect = { x: 4, y: 14, w: width - 64, h: height - 14 - 22 };
  const values = series.map((p) => p.v);
  const scale = niceScale(Math.min(...values), Math.max(...values), 3);
  const d = visual.chart === 'step' ? stepPath(series, scale, plot) : linePath(series, scale, plot);

  const last = series[series.length - 1];
  const lastX = xAt(series.length - 1, series.length, plot);
  const lastY = yAt(last.v, scale, plot);
  const unit = visual.unit ?? visual.groups?.[0]?.unit ?? '';
  const captionParts = [visual.title, visual.source].filter(Boolean);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Path d={d} stroke={theme.accent} strokeWidth={2} fill="none" strokeLinejoin="round" />
        <Circle cx={lastX} cy={lastY} r={5} fill={theme.surface} />
        <Circle cx={lastX} cy={lastY} r={3.5} fill={theme.accent} />
        <SvgText
          x={Math.min(lastX + 8, width - 4)}
          y={Math.min(Math.max(lastY + 4, 12), height - 26)}
          fontSize={12}
          fontFamily={font(700).fontFamily}
          fill={theme.accent}>
          {formatNumber(last.v)}
          {unit}
        </SvgText>
        <SvgText
          x={plot.x}
          y={height - 6}
          fontSize={10}
          fontFamily={font(400).fontFamily}
          fill={theme.textMuted}>
          {series[0].label ?? periodLabel(series[0].t)}
        </SvgText>
        <SvgText
          x={plot.x + plot.w}
          y={height - 6}
          fontSize={10}
          fontFamily={font(400).fontFamily}
          fill={theme.textMuted}
          textAnchor="end">
          {last.label ?? periodLabel(last.t)}
        </SvgText>
      </Svg>
      {captionParts.length > 0 && (
        <Text style={[styles.caption, { color: theme.textMuted }]} numberOfLines={1}>
          {captionParts.join(' · ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  caption: { fontSize: 11, ...font(400) },
});
