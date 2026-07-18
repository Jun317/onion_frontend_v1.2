/**
 * onion_backend_v1.2 정적 JSON 스키마.
 * 피드: out/index.json / 상세: out/issues/{id}.json
 * 백엔드 engine/export.py 의 _issue_card / _issue_detail 과 1:1 대응.
 */

export type Category =
  | 'RATE'
  | 'MACRO'
  | 'POLICY'
  | 'FX'
  | 'COMMODITY'
  | 'GEO'
  | 'MARKET'
  | 'EARNINGS'
  | 'ETC'
  // v4 MVP 큐레이션 카테고리 (라이브 파이프라인 코드와 한 피드에 공존하지 않음)
  | 'RATES'
  | 'STOCKS'
  | 'CRYPTO'
  | 'HOUSING'
  | 'AI_CHIPS'
  | 'PRICES'
  | 'FX_WORLD';

/** v4: 기간 등급 — 이번 주 / 최근 1개월 / 지난 1년 */
export type PeriodTier = 'weekly' | 'monthly' | 'yearly';

/** v4: 핵심 수치 타일 — 값은 백엔드가 완성한 문자열 (프론트 계산 금지) */
export interface KeyStat {
  value: string;
  label: string;
  direction: StatDirection;
}

/** v4: "그래서 어떻게 되나요" 구조화 행 — 방향 칩 + 본문 + 근거 */
export interface EffectRow {
  label: string; // 칩 문구 ("기름값 ↑")
  direction: 'up' | 'down' | 'info';
  text: string;
  basis?: string | null; // "근거 · …" 한 줄
}

export type IssueStatus = 'active' | 'stale';

export type StatDirection = 'up' | 'down' | 'flat';

/** 카드/히어로의 핵심 숫자 — 백엔드가 표기 문자열까지 완성한다 (프론트 계산 금지) */
export interface HeadlineStat {
  label: string; // "미국 기준금리" (entity + metric)
  value: string; // "3.62"
  unit: string; // "%"
  delta_text: string | null; // "-0.13%p"
  direction: StatDirection;
  prev_text: string | null; // "직전 3.75%"
}

export interface IssueCard {
  id: string;
  title: string;
  one_liner: string;
  why_now: string | null;
  raw_title: string;
  category: Category;
  status: IssueStatus;
  origin: 'cluster' | 'official_event' | 'curated';
  sources: number;
  importance: number;
  last_update: string; // ISO8601
  has_visual: boolean;
  // v2 필드 — 백엔드 배포 전에도 동작하도록 전부 optional
  headline_stat?: HeadlineStat | null;
  spark?: number[] | null; // visual.series 의 v 만 5–8개
  icon?: string | null; // 이슈 아이콘 이모지 1개
  // v3 필드 — 시점 배지 이원화(사건 시각) · "나에게는?" 생활 임팩트 한 줄
  event_at?: string | null; // 사건 시각 ISO8601 (last_update 는 카드 갱신 시각)
  impact_line?: string | null;
  // v4 필드 — MVP 큐레이션 카드 (전부 optional, 구 JSON 호환)
  period_tier?: PeriodTier;
  date_label?: string | null; // 발생일 표기 원문 ("2026.7.16(목) 오전 · 금통위")
  date_label_short?: string | null; // 카드 우상단용 축약 ("7.16(목)")
  key_stats?: KeyStat[] | null; // 핵심 수치 2개
  steady_ids?: string[] | null;
}

/** 스테디 상세 문단 내 이슈 참조 — phrase 는 text 에 반드시 포함 */
export interface SteadyRef {
  phrase: string;
  issue_id: string;
}

export interface SteadyPara {
  text: string;
  refs?: SteadyRef[];
}

/** v4: 스테디 타임라인 행의 이슈 링크 */
export interface SteadyTimelineLink {
  issue_id: string;
  label?: string; // 링크 칩 문구 (없으면 이슈 제목 사용)
}

/** v4: 스테디 타임라인 행 */
export interface SteadyTimelineEntry {
  date_label: string;
  text: string;
  links?: SteadyTimelineLink[];
  hot?: boolean;
}

/** 스테디 이슈 — 복합 이슈라 category 없음 (수동 큐레이션) */
export interface SteadyItem {
  id: string;
  icon?: string | null;
  title: string;
  one_liner: string;
  status_note?: string | null; // 태그라인 ("STEADY ISSUE 01 · 진행 중")
  visual?: Visual | null;
  detail: SteadyPara[];
  // v4 6블록 (전부 optional — 구 JSON 호환)
  definition?: string | null; // ① 한 줄 정의
  score?: KeyStat[] | null; // ② 지금 스코어 3
  story?: string[] | null; // ③ 지금까지 줄거리
  timeline?: SteadyTimelineEntry[] | null; // ④ 타임라인 (이슈 링크)
  impact?: string[] | null; // ⑤ 나에게 미치는 영향
  next_up?: string[] | null; // ⑥ 다음 화 예고
  visuals?: Visual[] | null; // 연결 시각자료 전체
}

/** v4: 카테고리 정의 (탭 순서 = 배열 순서) */
export interface CategoryDef {
  code: Category;
  label: string;
  emoji: string;
  description: string;
}

/** v4: 시장 스코어보드 행 — 저장 전용 (현재 미렌더) */
export interface ScoreboardRow {
  name: string;
  value: string;
  compare: string;
  as_of: string;
  status_line: string;
}

export interface FeedIndex {
  generated_at: string;
  attribution: string;
  issues: IssueCard[];
  schema_version?: number;
  steady?: SteadyItem[];
  // v4
  categories?: CategoryDef[];
  scoreboard?: ScoreboardRow[];
}

export interface SeriesPoint {
  t: string; // 정렬용 ISO 근사 ("YYYY-MM" 등)
  v: number | null; // v4: null = 데이터 갭 (선을 잇지 않음)
  label?: string; // v4: 표시용 라벨 ("고점", "7.13") — 없으면 periodLabel(t)
  role?: string; // v4: 막대 강조색 role (bar 전용)
}

export interface VisualGroup {
  name: string;
  series: SeriesPoint[];
  unit: string;
}

/** v4: 멀티 시리즈 (한·미·일 기준금리 등) */
export interface MultiSeries {
  name: string;
  color_role: string; // accent | up | down | gold | green | ink | muted
  dashed?: boolean;
  series: SeriesPoint[];
}

/** v4: 특정 포인트 강조 마커 */
export interface VisualMarker {
  index: number;
  color_role: string;
}

export interface TimelineVisualEntry {
  date_label: string;
  text: string;
  hot?: boolean;
}

export interface Visual {
  id?: string; // v4: 시각자료 ID (C1, T5, TL2 …)
  kind?: 'chart' | 'table' | 'timeline'; // v4 — 없으면 chart
  type?: string;
  chart?: 'step' | 'line' | 'bar';
  title: string;
  unit?: string;
  source?: string;
  note?: string; // v4: "읽는 법" 캡션
  series?: SeriesPoint[];
  groups?: VisualGroup[]; // earnings_quarterly 전용
  // v4 chart 확장
  series_multi?: MultiSeries[];
  markers?: VisualMarker[];
  color_role?: string; // 단일 시리즈 라인 색 role
  // v4 table
  columns?: string[];
  rows?: string[][];
  // v4 timeline
  entries?: TimelineVisualEntry[];
}

export interface Anchor {
  entity: string;
  metric: string;
  value: number;
  unit: string;
  prev: number | null;
  period: string;
  source: string;
}

export interface Headline {
  title: string;
  source: string;
  url: string;
  published_at: string;
  lang?: string; // v3: 원문 언어 ('en' 등) — 없으면 한글 비율로 추정
}

export interface TimelineEntry {
  kind: 'headline' | 'official';
  title: string;
  source: string;
  url: string;
  at: string;
}

export interface GlossaryEntry {
  term: string;
  easy: string;
  example: string;
}

export interface RelatedIssue {
  id: string;
  title: string;
  category: Category;
  shared: string[];
}

export interface IssueDetail extends IssueCard {
  details: string[];
  effects: string[];
  model: string;
  visual: Visual | null;
  anchors: Anchor[];
  headlines: Headline[];
  timeline: TimelineEntry[];
  glossary: GlossaryEntry[];
  related: RelatedIssue[];
  created_at: string;
  // v4 — 전부 optional (구 JSON 호환)
  effect_rows?: EffectRow[];
  tips?: string[];
  visuals?: Visual[]; // 인라인 해석본, 첫 번째 = 대표
}

export type SortKey = 'importance' | 'latest';
