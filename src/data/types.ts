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
}

export interface FeedIndex {
  generated_at: string;
  attribution: string;
  issues: IssueCard[];
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
