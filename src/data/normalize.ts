import type { IssueDetail, SeriesPoint, Visual } from './types';

/**
 * 백엔드 실측 데이터에서 발견된 이상 케이스 방어:
 * - earnings 시리즈에 같은 t 의 중복 포인트 존재 → t 기준 dedupe
 * - v 가 숫자가 아닌 포인트 제거
 * - 유효 포인트 2개 미만이면 차트 생략(visual → null)
 * - 배열 필드 null/undefined → 빈 배열 보정
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

export function normalizeVisual(visual: Visual | null | undefined): Visual | null {
  if (!visual || !visual.chart) return null;

  if (visual.groups && visual.groups.length > 0) {
    const groups = visual.groups
      .map((g) => ({ ...g, series: cleanSeries(g.series) }))
      .filter((g) => g.series.length >= 1);
    if (groups.length === 0) return null;
    return { ...visual, groups };
  }

  const series = cleanSeries(visual.series);
  if (series.length < 2) return null;
  return { ...visual, series };
}

export function normalizeDetail(raw: IssueDetail): IssueDetail {
  return {
    ...raw,
    details: Array.isArray(raw.details) ? raw.details.filter(Boolean) : [],
    effects: Array.isArray(raw.effects) ? raw.effects.filter(Boolean) : [],
    anchors: Array.isArray(raw.anchors) ? raw.anchors : [],
    headlines: Array.isArray(raw.headlines) ? raw.headlines : [],
    timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
    glossary: Array.isArray(raw.glossary) ? raw.glossary : [],
    related: Array.isArray(raw.related) ? raw.related : [],
    visual: normalizeVisual(raw.visual),
  };
}
