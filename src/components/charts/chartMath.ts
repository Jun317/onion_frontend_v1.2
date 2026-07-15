import type { SeriesPoint } from '@/data/types';

/** 보기 좋은 눈금 간격 (1/2/2.5/5 × 10^n) */
function niceStep(rough: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const frac = rough / pow;
  const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10;
  return nice * pow;
}

export interface Scale {
  min: number;
  max: number;
  ticks: number[];
}

/** min~max 를 감싸는 nice 눈금 3~5개 생성. includeZero 는 막대 차트용. */
export function niceScale(minV: number, maxV: number, tickCount = 4, includeZero = false): Scale {
  let lo = includeZero ? Math.min(0, minV) : minV;
  let hi = includeZero ? Math.max(0, maxV) : maxV;
  if (lo === hi) {
    // 평평한 시리즈 — 값 주변으로 인위적 범위
    const pad = Math.abs(lo) * 0.1 || 1;
    lo -= pad;
    hi += pad;
  }
  const step = niceStep((hi - lo) / Math.max(1, tickCount - 1));
  const niceLo = Math.floor(lo / step) * step;
  const niceHi = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  // 부동소수 누적 오차 방지를 위해 인덱스 곱으로 생성
  const n = Math.round((niceHi - niceLo) / step);
  for (let i = 0; i <= n; i++) ticks.push(niceLo + step * i);
  return { min: niceLo, max: niceHi, ticks };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function xAt(i: number, count: number, plot: Rect): number {
  if (count <= 1) return plot.x + plot.w / 2;
  return plot.x + (plot.w * i) / (count - 1);
}

export function yAt(v: number, scale: Scale, plot: Rect): number {
  const ratio = (v - scale.min) / (scale.max - scale.min);
  return plot.y + plot.h * (1 - ratio);
}

/** 꺾은선 path */
export function linePath(series: SeriesPoint[], scale: Scale, plot: Rect): string {
  return series
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${xAt(i, series.length, plot).toFixed(1)},${yAt(p.v, scale, plot).toFixed(1)}`)
    .join(' ');
}

/** 계단(step-after) path — 기준금리처럼 결정 시점까지 값이 유지되는 시리즈용 */
export function stepPath(series: SeriesPoint[], scale: Scale, plot: Rect): string {
  const parts: string[] = [];
  for (let i = 0; i < series.length; i++) {
    const x = xAt(i, series.length, plot);
    const y = yAt(series[i].v, scale, plot);
    if (i === 0) {
      parts.push(`M${x.toFixed(1)},${y.toFixed(1)}`);
    } else {
      parts.push(`H${x.toFixed(1)}`, `V${y.toFixed(1)}`);
    }
  }
  return parts.join(' ');
}

/** x축 라벨로 쓸 인덱스 4~5개 균등 샘플링 (처음/끝 포함) */
export function sampleIndices(count: number, target = 4): number[] {
  if (count <= target) return Array.from({ length: count }, (_, i) => i);
  const out: number[] = [];
  for (let i = 0; i < target; i++) {
    out.push(Math.round((i * (count - 1)) / (target - 1)));
  }
  return [...new Set(out)];
}

/** SvgText fontSize 11 기준 라벨 폭 추정(px) — 한글 ≈ fontSize, 숫자·기호 ≈ 0.62배 */
export function estimateLabelWidth(label: string, fontSize = 11): number {
  let w = 0;
  for (const ch of label) {
    w += ch >= 'ᄀ' ? fontSize : fontSize * 0.62; // CJK 전각 vs 반각
  }
  return w;
}

/**
 * 충돌 회피 x축 라벨 샘플링 — 균등 샘플 후, 이웃 라벨과 겹치는 인덱스를 버린다.
 * (실측: "2026-04-1230026-05-13" 처럼 겹쳐 렌더되던 결함의 재발 방지)
 * 처음/끝 라벨은 항상 유지하고, 중간 라벨만 추정 폭 + 최소 간격으로 검사한다.
 */
export function sampleLabelIndices(
  labels: string[],
  plot: Rect,
  target = 4,
  minGapPx = 10,
): number[] {
  const count = labels.length;
  const candidates = sampleIndices(count, target).filter((i) => labels[i].length > 0);
  if (candidates.length <= 1) return candidates;

  const centerX = (i: number) => xAt(i, count, plot);
  // 라벨 좌우 경계 — LineChart 의 textAnchor 규칙(처음 start / 끝 end / 중간 middle)과 동일
  const bounds = (i: number): [number, number] => {
    const w = estimateLabelWidth(labels[i]);
    if (i === 0) return [centerX(i), centerX(i) + w];
    if (i === count - 1) return [centerX(i) - w, centerX(i)];
    return [centerX(i) - w / 2, centerX(i) + w / 2];
  };

  const kept: number[] = [candidates[0]];
  const lastIdx = candidates[candidates.length - 1];
  for (const i of candidates.slice(1, -1)) {
    const [lo, hi] = bounds(i);
    const [, prevHi] = bounds(kept[kept.length - 1]);
    const [lastLo] = bounds(lastIdx);
    if (lo >= prevHi + minGapPx && hi <= lastLo - minGapPx) kept.push(i);
  }
  if (lastIdx !== kept[kept.length - 1]) {
    // 끝 라벨은 항상 포함 — 직전 라벨과 겹치면 직전 것을 버린다
    while (kept.length > 1) {
      const [, prevHi] = bounds(kept[kept.length - 1]);
      if (bounds(lastIdx)[0] >= prevHi + minGapPx) break;
      kept.pop();
    }
    kept.push(lastIdx);
  }
  return kept;
}

/** 눈금 라벨 포맷 — 스텝이 정수면 정수로, 아니면 소수 유지 */
export function tickLabel(v: number, ticks: number[]): string {
  const step = ticks.length > 1 ? ticks[1] - ticks[0] : 1;
  const decimals = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  return v.toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}
