import Svg, { G, Line, Rect as SvgRect, Text as SvgText } from 'react-native-svg';

import type { SeriesPoint } from '@/data/types';
import { roleColor, useTheme } from '@/theme';
import { formatNumber, periodLabel } from '@/utils/format';

import { niceScale, yAt, type Rect } from './chartMath';

interface Props {
  series: SeriesPoint[]; // null 슬롯 = 빈 막대("확인중" 등 라벨만)
  unit?: string;
  width: number;
  height?: number;
}

const PAD = { top: 22, bottom: 20 };
const BAR_MAX_W = 48;

/**
 * 단일 지표 막대 차트 (분기 영업이익·연도별 최저임금 등).
 * per-bar role 강조색 + null 슬롯(확정 전 데이터)은 점선 테두리 빈 막대로 정직하게 표시.
 */
export function SimpleBarChart({ series, unit = '', width, height = 170 }: Props) {
  const { theme } = useTheme();
  if (series.length === 0 || width <= 0) return null;

  const values = series.filter((p) => typeof p.v === 'number').map((p) => p.v as number);
  if (values.length < 2) return null;
  const scale = niceScale(Math.min(...values), Math.max(...values), 3, true);
  const plot: Rect = { x: 0, y: PAD.top, w: width, h: height - PAD.top - PAD.bottom };
  const zeroY = yAt(0, scale, plot);
  const slot = width / series.length;
  const barW = Math.min(BAR_MAX_W, slot * 0.55);

  return (
    <Svg width={width} height={height}>
      <Line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke={theme.axis} strokeWidth={1} />
      {series.map((p, i) => {
        const cx = slot * i + slot / 2;
        const label = p.label ?? periodLabel(p.t);
        if (typeof p.v !== 'number') {
          // 확정 전(null) 슬롯 — 값 없이 자리만 표시
          const ghostH = plot.h * 0.35;
          return (
            <G key={`${p.t}-${i}`}>
              <SvgRect
                x={cx - barW / 2}
                y={zeroY - ghostH}
                width={barW}
                height={ghostH}
                rx={4}
                fill="none"
                stroke={theme.hairline}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <SvgText x={cx} y={height - 4} fontSize={11} fill={theme.textMuted} textAnchor="middle">
                {label}
              </SvgText>
            </G>
          );
        }
        const y = yAt(p.v, scale, plot);
        const barTop = Math.min(y, zeroY);
        const barH = Math.max(2, Math.abs(y - zeroY));
        const color = roleColor(p.role ?? 'accent', theme);
        return (
          <G key={`${p.t}-${i}`}>
            <SvgRect x={cx - barW / 2} y={barTop} width={barW} height={barH} rx={4} fill={color} />
            <SvgText
              x={cx}
              y={p.v >= 0 ? barTop - 6 : barTop + barH + 14}
              fontSize={12}
              fontWeight="700"
              fill={theme.text}
              textAnchor="middle">
              {formatNumber(p.v)}
            </SvgText>
            <SvgText x={cx} y={height - 4} fontSize={11} fill={theme.textMuted} textAnchor="middle">
              {label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}
