/**
 * 순수 로직 테스트 (기기·네트워크 불필요):
 *   node --experimental-strip-types scripts/check-logic.ts
 * 차트 수학·글로서리 파서를 실데이터 형태로 검증한다.
 */
import { linePath, niceScale, sampleIndices, stepPath, xAt, yAt } from '../src/components/charts/chartMath.ts';
import { splitByTerms } from '../src/components/glossary/parse.ts';
import { cleanSeries, normalizeVisual } from '../src/data/normalize.ts';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`ASSERT FAIL: ${msg}`);
}

// ── niceScale ────────────────────────────────────────────
{
  const s = niceScale(3.62, 5.33, 4);
  assert(s.min <= 3.62 && s.max >= 5.33, 'scale covers data');
  assert(s.ticks.length >= 3 && s.ticks.length <= 7, `tick count sane (${s.ticks.length})`);
  const flat = niceScale(4.33, 4.33, 4);
  assert(flat.max > flat.min, 'flat series gets artificial range');
  const withZero = niceScale(163.7, 1531, 3, true);
  assert(withZero.min <= 0, 'bar scale includes zero');
}

// ── path 생성 ────────────────────────────────────────────
{
  const plot = { x: 0, y: 0, w: 300, h: 160 };
  const series = [
    { t: '2024-01', v: 5.33 },
    { t: '2024-02', v: 4.83 },
    { t: '2024-03', v: 4.33 },
  ];
  const scale = niceScale(4.33, 5.33, 4);
  const lp = linePath(series, scale, plot);
  assert(lp.startsWith('M') && lp.split('L').length === 3, `linePath (${lp})`);
  const sp = stepPath(series, scale, plot);
  assert(sp.includes('H') && sp.includes('V'), `stepPath (${sp})`);
  assert(xAt(0, 3, plot) === 0 && xAt(2, 3, plot) === 300, 'x endpoints');
  assert(yAt(scale.max, scale, plot) === 0 && yAt(scale.min, scale, plot) === 160, 'y endpoints');
  assert(sampleIndices(37, 4).length === 4, 'x label sampling');
  assert(sampleIndices(2, 4).join(',') === '0,1', 'small series labels');
}

// ── 글로서리 파서 ─────────────────────────────────────────
{
  const glossary = [
    { term: '금리', easy: '돈의 값이에요.', example: '' },
    { term: '기준금리', easy: '중앙은행이 정하는 금리예요.', example: '' },
  ];
  const segs = splitByTerms('미국 기준금리가 내려가면 시중 금리도 내려가요', glossary);
  const terms = segs.filter((s) => s.entry).map((s) => s.text);
  assert(terms.join('|') === '기준금리|금리', `긴 용어 우선 매칭 (${terms.join('|')})`);
  assert(segs.map((s) => s.text).join('') === '미국 기준금리가 내려가면 시중 금리도 내려가요', '원문 보존');
  const noTerm = splitByTerms('용어가 없는 문장', glossary);
  assert(noTerm.every((s) => !s.entry), '매칭 없음');
  const special = splitByTerms('S&P500(지수) 상승', [{ term: 'S&P500(지수)', easy: 'x', example: '' }]);
  assert(special.some((s) => s.entry), '정규식 특수문자 이스케이프');
}

// ── normalize (실측 이상 케이스) ──────────────────────────
{
  const dup = cleanSeries([
    { t: '2025-11013', v: 1531 },
    { t: '2025-11013', v: 1531 },
  ]);
  assert(dup.length === 1, 'earnings 중복 포인트 dedupe');
  const v = normalizeVisual({
    type: 'x',
    chart: 'line',
    title: 't',
    series: [{ t: '2024-01', v: 1 }],
  });
  assert(v === null, '포인트 1개 라인 차트는 생략');
  const g = normalizeVisual({
    type: 'earnings_quarterly',
    chart: 'bar',
    title: 't',
    groups: [{ name: '매출액', unit: '억원', series: [{ t: '2025-Q3', v: 1531 }] }],
  });
  assert(g !== null && g.groups![0].series.length === 1, '그룹 1포인트는 유지 (막대는 1개도 유효)');
}

console.log('ALL LOGIC CHECKS PASSED');
