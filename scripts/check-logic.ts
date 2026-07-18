/**
 * 순수 로직 테스트 (기기·네트워크 불필요):
 *   node --experimental-strip-types scripts/check-logic.ts
 * 차트 수학·글로서리 파서를 실데이터 형태로 검증한다.
 */
import { estimateLabelWidth, linePath, niceScale, sampleIndices, sampleLabelIndices, stepPath, xAt, yAt } from '../src/components/charts/chartMath.ts';
import { splitByTerms } from '../src/components/glossary/parse.ts';
import { cleanSeries, cleanSeriesKeepGaps, normalizeVisual, numericCount } from '../src/data/normalize.ts';
import { calcStreak, dateKey } from '../src/lib/attendance.ts';
import { koreanRatio, periodLabel, periodRange } from '../src/utils/format.ts';

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

// ── periodLabel 강건화 (실측 비정형 문자열) ────────────────
{
  assert(periodLabel('2026-07') === '26.7월', `YYYY-MM (${periodLabel('2026-07')})`);
  assert(periodLabel('2026-07-14') === '26.7.14', `YYYY-MM-DD (${periodLabel('2026-07-14')})`);
  assert(periodLabel('2025-1Q') === '25.1분기', `분기 (${periodLabel('2025-1Q')})`);
  // 실측 결함 데이터: "2025-11013" — 원문 노출 대신 파싱 가능 접두부(연도)로 축약
  const garbage = periodLabel('2025-11013');
  assert(garbage.length <= 6 && !garbage.includes('11013'), `비정형 축약 (${garbage})`);
  assert(periodLabel('완전 비정형') === '', '파싱 불가는 빈 문자열 (라벨 숨김)');
  const range = periodRange([{ t: '2026-01' }, { t: '2026-04' }, { t: '2026-07' }]);
  assert(range === '26.1월 – 26.7월', `기간 캡션 (${range})`);
}

// ── x축 라벨 충돌 회피 ────────────────────────────────────
{
  const plot = { x: 0, y: 0, w: 300, h: 160 };
  const labels12 = Array.from({ length: 12 }, (_, i) => `26.${(i % 12) + 1}월`);
  const picked = sampleLabelIndices(labels12, plot, 4);
  assert(picked.length >= 2 && picked.length <= 4, `label count (${picked.length})`);
  assert(picked[0] === 0 && picked[picked.length - 1] === 11, '양끝 라벨 유지');
  // 좁은 플롯 + 긴 라벨 → 겹치는 중간 라벨은 탈락해야 함
  const narrow = { x: 0, y: 0, w: 120, h: 160 };
  const longLabels = Array.from({ length: 8 }, () => '2026.12.31');
  const picked2 = sampleLabelIndices(longLabels, narrow, 4);
  for (let i = 1; i < picked2.length; i++) {
    const prev = xAt(picked2[i - 1], 8, narrow);
    const cur = xAt(picked2[i], 8, narrow);
    assert(cur - prev >= estimateLabelWidth('2026.12.31') / 2, `라벨 겹침 없음 (${picked2.join(',')})`);
  }
  // 빈 라벨(비정형)은 후보에서 제외
  const someEmpty = ['26.1월', '', '', '26.4월'];
  const picked3 = sampleLabelIndices(someEmpty, plot, 4);
  assert(picked3.every((i) => someEmpty[i] !== ''), '빈 라벨 제외');
}

// ── koreanRatio (영어 헤드라인 판별) ──────────────────────
{
  assert(koreanRatio('한국은행이 기준금리를 내렸어요') > 0.9, '한국어 문장');
  assert(koreanRatio('Fed cuts rates by 25bp') < 0.3, '영어 문장');
  assert(koreanRatio('') === 0, '빈 문자열');
}

// ── 출석 스트릭 ──────────────────────────────────────────
{
  const DAY = 24 * 60 * 60_000;
  const now = Date.now();
  const d = (n: number) => dateKey(now - n * DAY);
  assert(calcStreak([], now) === 0, '출석 없음');
  assert(calcStreak([d(0)], now) === 1, '오늘만');
  assert(calcStreak([d(2), d(1), d(0)], now) === 3, '3일 연속');
  assert(calcStreak([d(3), d(2), d(1)], now) === 3, '오늘 미출석이면 어제부터 계산');
  assert(calcStreak([d(4), d(3), d(1)], now) === 1, '중간 공백은 끊김');
  assert(calcStreak([d(5), d(4)], now) === 0, '이틀 전 이전 기록만 있으면 0');
}

// ── v4 normalizeVisual: kind 분기·멀티시리즈·null 갭 보존 ──
{
  const table = normalizeVisual({
    kind: 'table', title: '표', columns: ['지표', '값'], rows: [['금리', '2.75%']],
  });
  assert(table !== null && table.kind === 'table', 'table kind 통과');
  assert(normalizeVisual({ kind: 'table', title: '빈 표', columns: [], rows: [] }) === null, '빈 표는 null');

  const tl = normalizeVisual({
    kind: 'timeline', title: '일지', entries: [{ date_label: '2.28', text: '전쟁 발발' }],
  });
  assert(tl !== null && tl.kind === 'timeline', 'timeline kind 통과');

  const multi = normalizeVisual({
    kind: 'chart', chart: 'line', title: '한미 물가',
    series_multi: [
      { name: '한국', color_role: 'accent', series: [{ t: '2026-01', v: 1.9 }, { t: '2026-02', v: 1.9 }, { t: '2026-03', v: 2.3 }] },
      { name: '미국', color_role: 'up', series: [{ t: '2026-01', v: 3.0 }, { t: '2026-02', v: null }, { t: '2026-03', v: 3.7 }] },
      { name: '빈 시리즈', color_role: 'muted', series: [{ t: '2026-01', v: null }] },
    ],
  });
  assert(multi !== null && multi.series_multi!.length === 2, '멀티시리즈: 유효 2개만 유지');
  assert(multi.series_multi![1].series.some((p) => p.v === null), 'null 갭 보존');

  // 막대는 null 슬롯 보존, 라인은 기존 정제 유지
  const bar = normalizeVisual({
    kind: 'chart', chart: 'bar', title: '영업이익',
    series: [{ t: '2025-Q3', v: 12.2 }, { t: '2025-Q4', v: null, label: '확인중' }, { t: '2026-Q1', v: 57.2 }],
  });
  assert(bar !== null && bar.series!.length === 3 && bar.series![1].v === null, '막대 null 슬롯 보존');
  assert(numericCount(bar.series) === 2, 'numericCount 는 갭 제외');
  const gaps = cleanSeriesKeepGaps([{ t: 'a', v: 1 }, { t: 'b', v: null }, { t: 'b', v: null }, { t: 'c', v: 2 }]);
  assert(gaps.length === 3, 'keepGaps dedupe + 갭 유지');
}

console.log('ALL LOGIC CHECKS PASSED');
