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
  // v3 필드 — 시점 배지 이원화(사건 시각) · "나에게는?" 생활 임팩트 한 줄
  event_at?: string | null; // 사건 시각 ISO8601 (last_update 는 카드 갱신 시각)
  impact_line?: string | null;
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

/** 스테디 이슈 — 복합 이슈라 category 없음 (steady.yaml 수동 큐레이션) */
export interface SteadyItem {
  id: string;
  icon?: string | null;
  title: string;
  one_liner: string;
  status_note?: string | null; // "1년째 지켜보는 중"
  visual?: Visual | null;
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
}

export type SortKey = 'importance' | 'latest';
