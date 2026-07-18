import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect as SvgRect, Text as SvgText } from 'react-native-svg';

import type { VisualGroup } from '@/data/types';
import { spacing, useTheme } from '@/theme';
import { formatNumber, periodLabel } from '@/utils/format';

import { niceScale, yAt, type Rect } from './chartMath';

interface Props {
  groups: VisualGroup[];
  width: number;
}

const ROW_H = 130;
const PAD = { top: 22, bottom: 20 };
const BAR_MAX_W = 48;

/** 분기 실적(매출액/영업이익 등) — 그룹별 미니 막대 차트. 포인트 1개(단일 분기)도 정상 렌더. */
export function BarGroupChart({ groups, width }: Props) {
  const { theme } = useTheme();
  if (groups.length === 0 || width <= 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      {groups.map((group) => {
        // 그룹 시리즈는 cleanSeries 를 통과해 null 이 없지만, 타입 좁힘을 위해 필터
        const series = group.series.filter(
          (p): p is (typeof p) & { v: number } => typeof p.v === 'number' && isFinite(p.v),
        );
        if (series.length === 0) return null;
        const values = series.map((p) => p.v);
        const scale = niceScale(Math.min(...values), Math.max(...values), 3, true);
        const plot: Rect = { x: 0, y: PAD.top, w: width, h: ROW_H - PAD.top - PAD.bottom };
        const zeroY = yAt(0, scale, plot);
        const n = series.length;
        const slot = width / n;
        const barW = Math.min(BAR_MAX_W, slot * 0.5);

        return (
          <View key={group.name}>
            <Text style={[styles.groupName, { color: theme.textSecondary }]}>{group.name}</Text>
            <Svg width={width} height={ROW_H}>
              {/* 0 기준선 (영업손실 등 음수 대비) */}
              <Line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke={theme.axis} strokeWidth={1} />
              {series.map((p, i) => {
                const cx = slot * i + slot / 2;
                const y = yAt(p.v, scale, plot);
                const barTop = Math.min(y, zeroY);
                const barH = Math.max(2, Math.abs(y - zeroY));
                const labelY = p.v >= 0 ? barTop - 6 : barTop + barH + 14;
                return (
                  <G key={`${p.t}-${i}`}>
                    <SvgRect
                      x={cx - barW / 2}
                      y={barTop}
                      width={barW}
                      height={barH}
                      rx={4}
                      fill={theme.accent}
                    />
                    <SvgText
                      x={cx}
                      y={labelY}
                      fontSize={12}
                      fontWeight="700"
                      fill={theme.text}
                      textAnchor="middle">
                      {formatNumber(p.v)}
                      {group.unit}
                    </SvgText>
                    <SvgText
                      x={cx}
                      y={ROW_H - 4}
                      fontSize={11}
                      fill={theme.textMuted}
                      textAnchor="middle">
                      {periodLabel(p.t)}
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  groupName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
});
