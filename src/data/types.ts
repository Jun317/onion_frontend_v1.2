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
  | 'GEO'
  | 'MARKET'
  | 'EARNINGS'
  | 'ETC';

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
  origin: 'cluster' | 'official_event';
  sources: number;
  importance: number;
  last_update: string; // ISO8601
  has_visual: boolean;
  // v2 필드 — 백엔드 배포 전에도 동작하도록 전부 optional
  headline_stat?: HeadlineStat | null;
  spark?: number[] | null; // visual.series 의 v 만 5–8개
  icon?: string | null; // 이슈 아이콘 이모지 1개
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

/** 주제의 가장 최근 핵심 이슈 — 백엔드 latest_match 규칙이 자동 해석 */
export interface SteadyLatestIssue {
  id: string;
  title: string;
  one_liner: string;
  icon?: string | null;
  last_update: string;
}

/** 핵심 수치 표 — 예: 미국 진영 vs 이란 진영 비교. 수치엔 출처 필수 */
export interface SteadyTableData {
  title: string;
  columns: string[];
  rows: string[][];
  source: string;
}

/** 스테디 이슈 — 복합 이슈라 category 없음 (steady.yaml 수동 큐레이션) */
export interface SteadyItem {
  id: string;
  icon?: string | null;
  title: string;
  one_liner: string;
  status_note?: string | null; // "1년째 지켜보는 중"
  visual?: Visual | null;
  // v2.3 — 첫 페이지 구성 요소 (전부 optional)
  latest_issue?: SteadyLatestIssue | null;
  impact?: string[]; // 경제(주식·채권·물가·금리) 영향
  table?: SteadyTableData | null;
  detail: SteadyPara[];
}

export interface FeedIndex {
  generated_at: string;
  attribution: string;
  issues: IssueCard[];
  schema_version?: number;
  steady?: SteadyItem[];
}

export interface SeriesPoint {
  t: string; // "YYYY-MM" 또는 분기 표기 등 비정형 문자열
  v: number;
}

export interface VisualGroup {
  name: string;
  series: SeriesPoint[];
  unit: string;
}

export interface Visual {
  type: string;
  chart: 'step' | 'line' | 'bar';
  title: string;
  unit?: string;
  source?: string;
  series?: SeriesPoint[];
  groups?: VisualGroup[]; // earnings_quarterly 전용
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
}

export type SortKey = 'importance' | 'latest';
