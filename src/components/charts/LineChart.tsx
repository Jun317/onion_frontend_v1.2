import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import type { MultiSeries, SeriesPoint, VisualMarker } from '@/data/types';
import { font, roleColor, spacing, useTheme } from '@/theme';
import { formatNumber, periodLabel } from '@/utils/format';

import { niceScale, sampleLabelIndices, tickLabel, xAt, yAt, type Rect, type Scale } from './chartMath';

interface Props {
  series?: SeriesPoint[]; // 단일 시리즈 (레거시 호환)
  seriesMulti?: MultiSeries[]; // v4 멀티 시리즈 (범례·점선 지원)
  markers?: VisualMarker[]; // v4 특정 포인트 강조 (단일 시리즈 기준)
  colorRole?: string; // v4 단일 시리즈 라인 색 role
  unit?: string;
  step?: boolean; // 기준금리 등 계단형
  width: number;
  height?: number;
}

const PAD = { top: 24, right: 56, bottom: 24, left: 8 };

type NumericPoint = SeriesPoint & { v: number };

const isNum = (p: SeriesPoint): p is NumericPoint => typeof p.v === 'number' && isFinite(p.v);

/** null 갭 기준으로 연속 숫자 구간을 나눈다 — 구간별로 선을 그려 갭을 잇지 않는다 */
function numericRuns(series: SeriesPoint[]): { offset: number; points: NumericPoint[] }[] {
  const runs: { offset: number; points: NumericPoint[] }[] = [];
  let current: NumericPoint[] = [];
  let offset = 0;
  series.forEach((p, i) => {
    if (isNum(p)) {
      if (current.length === 0) offset = i;
      current.push(p);
    } else if (current.length > 0) {
      runs.push({ offset, points: current });
      current = [];
    }
  });
  if (current.length > 0) runs.push({ offset, points: current });
  return runs;
}

function pathFor(run: { offset: number; points: NumericPoint[] }, count: number,
  scale: Scale, plot: Rect, step: boolean): string {
  // 구간의 x 는 전체 인덱스 기준 — chartMath 의 path 빌더를 구간 오프셋으로 재현
  const pts = run.points.map((p, i) => ({
    x: xAt(run.offset + i, count, plot),
    y: yAt(p.v, scale, plot),
  }));
  if (!step) {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  }
  const parts: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    if (i === 0) parts.push(`M${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`);
    else parts.push(`H${pts[i].x.toFixed(1)}`, `V${pts[i].y.toFixed(1)}`);
  }
  return parts.join(' ');
}

/**
 * 꺾은선/계단 차트 — 단일(마지막 값 라벨) 또는 멀티(범례 + 점선 + null 갭 분할).
 * 마커: 지정 포인트를 role 색 도트로 강조 (사상 최고·폭락일 등).
 */
export function LineChart({
  series,
  seriesMulti,
  markers,
  colorRole,
  unit = '',
  step = false,
  width,
  height = 200,
}: Props) {
  const { theme } = useTheme();
  const multi = seriesMulti && seriesMulti.length > 0 ? seriesMulti : null;
  const primary = multi ? multi[0].series : (series ?? []);
  const count = primary.length;
  if (count < 2 || width <= 0) return null;

  const plot: Rect = {
    x: PAD.left,
    y: PAD.top,
    w: width - PAD.left - PAD.right,
    h: height - PAD.top - PAD.bottom,
  };

  const allValues = (multi ? multi.flatMap((s) => s.series) : primary)
    .filter(isNum)
    .map((p) => p.v);
  if (allValues.length < 2) return null;
  const scale = niceScale(Math.min(...allValues), Math.max(...allValues), 4);

  // 라인 색: 멀티는 role 별, 단일은 role 지정 > 추세색(상승 빨강/하락 파랑)
  const primaryNums = primary.filter(isNum);
  const first = primaryNums[0].v;
  const last = primaryNums[primaryNums.length - 1].v;
  const trendColor = last > first ? theme.up : last < first ? theme.down : theme.accent;
  const singleColor = colorRole ? roleColor(colorRole, theme) : trendColor;

  const lastIdx = primary.lastIndexOf(primaryNums[primaryNums.length - 1]);
  const lastX = xAt(lastIdx, count, plot);
  const lastY = yAt(last, scale, plot);

  const labelTexts = primary.map((p) => p.label ?? periodLabel(p.t));
  const xLabels = sampleLabelIndices(labelTexts, plot, 4);

  const drawSeries = multi
    ? multi.map((s) => ({
        pts: s.series,
        color: roleColor(s.color_role, theme),
        dashed: !!s.dashed,
        name: s.name,
      }))
    : [{ pts: primary, color: singleColor, dashed: false, name: '' }];

  return (
    <View style={styles.container}>
      {multi && (
        <View style={styles.legend}>
          {drawSeries.map((s) => (
            <View key={s.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{s.name}</Text>
            </View>
          ))}
        </View>
      )}
      <Svg width={width} height={height}>
        {scale.ticks.map((t) => (
          <Line
            key={`g${t}`}
            x1={plot.x}
            x2={plot.x + plot.w}
            y1={yAt(t, scale, plot)}
            y2={yAt(t, scale, plot)}
            stroke={theme.hairline}
            strokeWidth={1}
          />
        ))}
        {scale.ticks.map((t) => (
          <SvgText
            key={`yl${t}`}
            x={plot.x + plot.w + 6}
            y={yAt(t, scale, plot) + 4}
            fontSize={11}
            fill={theme.textMuted}>
            {tickLabel(t, scale.ticks)}
            {unit}
          </SvgText>
        ))}

        {drawSeries.map((s, si) =>
          numericRuns(s.pts).map((run, ri) =>
            run.points.length === 1 ? (
              // 고립 포인트(양옆이 갭)는 선 대신 도트
              <Circle
                key={`r${si}-${ri}`}
                cx={xAt(run.offset, s.pts.length, plot)}
                cy={yAt(run.points[0].v, scale, plot)}
                r={3}
                fill={s.color}
              />
            ) : (
              <Path
                key={`r${si}-${ri}`}
                d={pathFor(run, s.pts.length, scale, plot, step)}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? '6 4' : undefined}
                fill="none"
                strokeLinejoin="round"
              />
            ),
          ),
        )}

        {/* 마커 강조 (단일 시리즈 기준) */}
        {!multi &&
          (markers ?? []).map((m) => {
            const p = primary[m.index];
            if (!p || !isNum(p)) return null;
            return (
              <Circle
                key={`m${m.index}`}
                cx={xAt(m.index, count, plot)}
                cy={yAt(p.v, scale, plot)}
                r={4.5}
                fill={roleColor(m.color_role, theme)}
              />
            );
          })}

        {/* 마지막 값 강조 — 주 시리즈만 */}
        <Circle cx={lastX} cy={lastY} r={6} fill={theme.surface} />
        <Circle cx={lastX} cy={lastY} r={4} fill={drawSeries[0].color} />
        <SvgText
          x={Math.min(lastX, plot.x + plot.w - 4)}
          y={Math.max(12, lastY - 10)}
          fontSize={12}
          fontWeight="700"
          fill={theme.text}
          textAnchor="end">
          {formatNumber(last)}
          {unit}
        </SvgText>

        {/* x축 라벨 — 충돌 회피 샘플링 결과만 렌더 */}
        {xLabels.map((i) => (
          <SvgText
            key={`xl${i}`}
            x={xAt(i, count, plot)}
            y={height - 6}
            fontSize={11}
            fill={theme.textMuted}
            textAnchor={i === 0 ? 'start' : i === count - 1 ? 'end' : 'middle'}>
            {labelTexts[i]}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingLeft: PAD.left },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, ...font(600) },
});
