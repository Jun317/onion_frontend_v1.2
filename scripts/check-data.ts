/**
 * 데이터 레이어 스모크 테스트 (기기 없이 실행):
 *   node --experimental-strip-types scripts/check-data.ts
 * 실제 백엔드 JSON 을 fetch 해 스키마·정규화·정렬 로직을 검증한다.
 */
import { normalizeDetail, normalizeVisual } from '../src/data/normalize.ts';
import { sortIssues } from '../src/data/sort.ts';
import { periodLabel, relativeTime } from '../src/utils/format.ts';
import type { FeedIndex, IssueDetail } from '../src/data/types.ts';

const BASES = [
  'https://jun317.github.io/onion_backend_v1.2/out',
  'https://raw.githubusercontent.com/jun317/onion_backend_v1.2/main/out',
];

async function fetchJson<T>(path: string): Promise<T> {
  let lastErr: unknown;
  for (const base of BASES) {
    try {
      const res = await fetch(base + path);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${base + path}`);
      console.log(`  ok: ${base + path}`);
      return (await res.json()) as T;
    } catch (e) {
      console.log(`  skip (${(e as Error).message.slice(0, 60)}): ${base + path}`);
      lastErr = e;
    }
  }
  throw lastErr;
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT FAIL: ${msg}`);
}

const feed = await fetchJson<FeedIndex>('/index.json');
assert(typeof feed.generated_at === 'string', 'generated_at');
assert(Array.isArray(feed.issues) && feed.issues.length > 0, 'issues[]');
for (const c of feed.issues) {
  assert(typeof c.id === 'string' && c.id.length > 0, `card id (${c.id})`);
  assert(typeof c.title === 'string', `title (${c.id})`);
  assert(typeof c.importance === 'number', `importance (${c.id})`);
  // v2 optional 필드 — 있으면 형태 검증
  if (c.headline_stat != null) {
    assert(typeof c.headline_stat.value === 'string', `headline_stat.value (${c.id})`);
    assert(typeof c.headline_stat.unit === 'string', `headline_stat.unit (${c.id})`);
    assert(['up', 'down', 'flat'].includes(c.headline_stat.direction), `headline_stat.direction (${c.id})`);
  }
  if (c.spark != null) {
    assert(Array.isArray(c.spark) && c.spark.every((v) => typeof v === 'number'), `spark[] (${c.id})`);
    assert(c.spark.length >= 2 && c.spark.length <= 8, `spark length 2–8 (${c.id})`);
  }
  if (c.icon != null) assert(typeof c.icon === 'string' && c.icon.length > 0, `icon (${c.id})`);
}
// v2 steady — 있으면 형태·참조 계약 검증 (refs.phrase 는 text 에 포함)
if (feed.steady != null) {
  assert(Array.isArray(feed.steady), 'steady[]');
  for (const s of feed.steady) {
    assert(typeof s.id === 'string' && s.id.length > 0, `steady id (${s.id})`);
    assert(typeof s.title === 'string' && typeof s.one_liner === 'string', `steady text (${s.id})`);
    assert(Array.isArray(s.detail), `steady detail[] (${s.id})`);
    for (const para of s.detail) {
      assert(typeof para.text === 'string', `steady para text (${s.id})`);
      for (const ref of para.refs ?? []) {
        assert(para.text.includes(ref.phrase), `steady ref phrase in text (${s.id}: ${ref.phrase})`);
      }
    }
  }
  console.log(`steady: ${feed.steady.length} items ok`);
}
console.log(`feed: ${feed.issues.length} issues, generated ${relativeTime(feed.generated_at)}`);

const byImportance = sortIssues(feed.issues, 'importance');
const byLatest = sortIssues(feed.issues, 'latest');
const activeImp = byImportance.filter((i) => i.status === 'active');
for (let i = 1; i < activeImp.length; i++) {
  assert(activeImp[i - 1].importance >= activeImp[i].importance, 'importance order');
}
assert(
  byImportance.findIndex((i) => i.status === 'stale') >=
    byImportance.filter((i) => i.status === 'active').length,
  'stale after active',
);
console.log(
  `sort ok — top(importance): ${byImportance[0].title} / top(latest): ${byLatest[0].title}`,
);

// 상세 전수 검사 (30건 내외라 부담 없음)
let visuals = 0;
let glossaryTerms = 0;
for (const card of feed.issues) {
  const raw = await fetchJson<IssueDetail>(`/issues/${card.id}.json`);
  const d = normalizeDetail(raw);
  assert(Array.isArray(d.details), `details[] (${card.id})`);
  if (d.visual) {
    visuals++;
    const v = normalizeVisual(d.visual);
    assert(v, `visual survives normalize (${card.id})`);
    if (v.groups) {
      for (const g of v.groups) {
        const ts = g.series.map((p) => p.t);
        assert(new Set(ts).size === ts.length, `dedup groups (${card.id})`);
      }
    } else {
      assert((v.series?.length ?? 0) >= 2, `series>=2 (${card.id})`);
      const ts = v.series!.map((p) => p.t);
      assert(new Set(ts).size === ts.length, `dedup series (${card.id})`);
    }
  }
  glossaryTerms += d.glossary.length;
}
console.log(`details: ${feed.issues.length} ok, visuals ${visuals}, glossary terms ${glossaryTerms}`);

// period 라벨 방어 확인
assert(periodLabel('2024-07') === '24.7월', 'periodLabel normal');
assert(periodLabel('2025-11013') === '2025-11013', 'periodLabel malformed passthrough');
console.log('ALL CHECKS PASSED');
