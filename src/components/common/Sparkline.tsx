import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme';

interface Props {
  data: number[];
  width: number;
  height?: number;
  color?: string;
}

/** 초소형 추세선 — 차트 컨텍스트 안에서만 사용 (피드 카드에는 쓰지 않는다) */
export function Sparkline({ data, width, height = 28, color }: Props) {
  const { theme } = useTheme();
  if (data.length < 2 || width <= 0) return null;

  const stroke = color ?? theme.accent;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pad = 3;
  const x = (i: number) => pad + ((width - pad * 2) * i) / (data.length - 1);
  const y = (v: number) => pad + (height - pad * 2) * (1 - (v - min) / span);
  const d = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  return (
    <Svg width={width} height={height}>
      <Path d={d} stroke={stroke} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
      <Circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r={2.5} fill={stroke} />
    </Svg>
  );
}
