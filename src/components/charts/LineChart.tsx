import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import type { SeriesPoint } from '@/data/types';
import { useTheme } from '@/theme';
import { formatNumber, periodLabel } from '@/utils/format';

import { linePath, niceScale, sampleLabelIndices, stepPath, tickLabel, xAt, yAt, type Rect } from './chartMath';

interface Props {
  series: SeriesPoint[];
  unit?: string;
  step?: boolean; // 기준금리 등 계단형
  width: number;
  height?: number;
}

const PAD = { top: 24, right: 56, bottom: 24, left: 8 };

/** 단일 시리즈 꺾은선/계단 차트 — 마지막 값을 직접 라벨링 (범례 불필요) */
export function LineChart({ series, unit = '', step = false, width, height = 200 }: Props) {
  const { theme } = useTheme();
  if (series.length < 2 || width <= 0) return null;

  const plot: Rect = {
    x: PAD.left,
    y: PAD.top,
    w: width - PAD.left - PAD.right,
    h: height - PAD.top - PAD.bottom,
  };

  const values = series.map((p) => p.v);
  const scale = niceScale(Math.min(...values), Math.max(...values), 4);
  const d = step ? stepPath(series, scale, plot) : linePath(series, scale, plot);

  const first = series[0].v;
  const last = series[series.length - 1].v;
  // 추세 색: 상승=빨강, 하락=파랑 (국내 금융 관례), 보합=기본 액센트
  const lineColor = last > first ? theme.up : last < first ? theme.down : theme.accent;

  const lastX = xAt(series.length - 1, series.length, plot);
  const lastY = yAt(last, scale, plot);
  // 라벨 텍스트 기준 충돌 회피 샘플링 — 최대 4개, 겹치는 중간 라벨은 드롭
  const labelTexts = series.map((p) => periodLabel(p.t));
  const xLabels = sampleLabelIndices(labelTexts, plot, 4);

  return (
    <Svg width={width} height={height}>
      {/* 그리드 (은은하게) + y축 라벨은 오른쪽 */}
      {scale.ticks.map((t) => {
        const y = yAt(t, scale, plot);
        return (
          <Line
            key={`g${t}`}
            x1={plot.x}
            x2={plot.x + plot.w}
            y1={y}
            y2={y}
            stroke={theme.hairline}
            strokeWidth={1}
          />
        );
      })}
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

      <Path d={d} stroke={lineColor} strokeWidth={2} fill="none" strokeLinejoin="round" />

      {/* 마지막 값 강조: 서피스 링 + 마커 + 값 라벨 */}
      <Circle cx={lastX} cy={lastY} r={6} fill={theme.surface} />
      <Circle cx={lastX} cy={lastY} r={4} fill={lineColor} />
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
          x={xAt(i, series.length, plot)}
          y={height - 6}
          fontSize={11}
          fill={theme.textMuted}
          textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'}>
          {labelTexts[i]}
        </SvgText>
      ))}
    </Svg>
  );
}
