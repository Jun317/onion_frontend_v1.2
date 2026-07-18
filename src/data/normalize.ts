import type { IssueDetail, SeriesPoint, Visual } from './types';

/**
 * 백엔드 실측 데이터에서 발견된 이상 케이스 방어:
 * - earnings 시리즈에 같은 t 의 중복 포인트 존재 → t 기준 dedupe
 * - v 가 숫자가 아닌 포인트 제거 (단, v4 의 명시적 null 갭은 보존)
 * - 유효 포인트 2개 미만이면 차트 생략(visual → null)
 * - 배열 필드 null/undefined → 빈 배열 보정
 * - v4: kind(table/timeline)·series_multi 는 차트 검사보다 먼저 분기
 */

export function cleanSeries(series: SeriesPoint[] | undefined): SeriesPoint[] {
  if (!Array.isArray(series)) return [];
  const seen = new Set<string>();
  const out: SeriesPoint[] = [];
  for (const p of series) {
    if (!p || typeof p.v !== 'number' || !isFinite(p.v)) continue;
    if (typeof p.t !== 'string' || seen.has(p.t)) continue;
    seen.add(p.t);
    out.push(p);
  }
  return out;
}

/**
 * v4 시리즈 정제 — null 은 '데이터 갭'(선을 잇지 않는 빈 슬롯)으로 보존한다.
 * (기존 cleanSeries 로 처리하면 갭 양쪽이 이어져 그려지는 왜곡이 생김)
 */
export function cleanSeriesKeepGaps(series: SeriesPoint[] | undefined): SeriesPoint[] {
  if (!Array.isArray(series)) return [];
  const seen = new Set<string>();
  const out: SeriesPoint[] = [];
  for (const p of series) {
    if (!p || typeof p.t !== 'string' || seen.has(p.t)) continue;
    if (p.v !== null && (typeof p.v !== 'number' || !isFinite(p.v))) continue;
    seen.add(p.t);
    out.push(p);
  }
  return out;
}

/** 시리즈의 숫자 포인트 수 (갭 제외) */
export function numericCount(series: SeriesPoint[] | undefined): number {
  return (series ?? []).filter((p) => typeof p.v === 'number' && isFinite(p.v)).length;
}

export function normalizeVisual(visual: Visual | null | undefined): Visual | null {
  if (!visual) return null;

  // v4 kind 분기 — 차트 필드 검사보다 먼저 (table/timeline 은 chart 필드가 없음)
  const kind = visual.kind ?? 'chart';
  if (kind === 'table') {
    if (!visual.columns?.length || !visual.rows?.length) return null;
    return visual;
  }
  if (kind === 'timeline') {
    if (!visual.entries?.length) return null;
    return visual;
  }

  // v4 멀티 시리즈 차트 — 숫자 포인트 2개 이상인 시리즈만 유지
  if (visual.series_multi && visual.series_multi.length > 0) {
    const multi = visual.series_multi
      .map((s) => ({ ...s, series: cleanSeriesKeepGaps(s.series) }))
      .filter((s) => numericCount(s.series) >= 2);
    if (multi.length === 0) return null;
    return { ...visual, series_multi: multi };
  }

  if (!visual.chart) return null;

  if (visual.groups && visual.groups.length > 0) {
    const groups = visual.groups
      .map((g) => ({ ...g, series: cleanSeries(g.series) }))
      .filter((g) => g.series.length >= 1);
    if (groups.length === 0) return null;
    return { ...visual, groups };
  }

  // 막대는 null 슬롯("확인중")을 보존, 라인은 기존 정제 유지
  const series =
    visual.chart === 'bar' ? cleanSeriesKeepGaps(visual.series) : cleanSeries(visual.series);
  if (numericCount(series) < 2) return null;
  return { ...visual, series };
}

export function normalizeDetail(raw: IssueDetail): IssueDetail {
  const visuals = Array.isArray(raw.visuals)
    ? raw.visuals.map(normalizeVisual).filter((v): v is Visual => v !== null)
    : [];
  return {
    ...raw,
    details: Array.isArray(raw.details) ? raw.details.filter(Boolean) : [],
    effects: Array.isArray(raw.effects) ? raw.effects.filter(Boolean) : [],
    effect_rows: Array.isArray(raw.effect_rows) ? raw.effect_rows : [],
    tips: Array.isArray(raw.tips) ? raw.tips.filter(Boolean) : [],
    anchors: Array.isArray(raw.anchors) ? raw.anchors : [],
    headlines: Array.isArray(raw.headlines) ? raw.headlines : [],
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
    glossary: Array.isArray(raw.glossary) ? raw.glossary : [],
    related: Array.isArray(raw.related) ? raw.related : [],
    visual: normalizeVisual(raw.visual),
    visuals,
  };
}
