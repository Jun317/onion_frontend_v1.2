import type { Category } from '@/data/types';

import { font } from './fonts';

export { font, fontSources } from './fonts';

/**
 * 어니언 v2 디자인 토큰 — 라이트 모드 고정 (redesignspec v2 §2).
 * Accent 는 보라 하나: 워드마크·활성 탭·CTA·진행 세그먼트·링크·기본 차트 라인.
 * 시장 색 관례: 상승 = 빨강, 하락 = 파랑 (절대 반전 금지).
 */
export const palette = {
  background: '#f2f2f7', // 페이지 배경 — iOS systemGroupedBackground
  surface: '#ffffff', // 카드·차트·시트
  text: '#111113',
  textSecondary: '#55555c',
  textMuted: '#8e8e93', // iOS systemGray
  hairline: '#e5e5ea',
  axis: '#c7c7cc',
  border: 'rgba(0,0,0,0.06)',
  accent: '#4a2586', // purple-700 — 유일한 브랜드 색
  accentSoft: '#e8ddf6', // 진행 세그먼트(지난)·effects 카드 배경
  onAccent: '#ffffff', // accent 배경 위 글자
  success: '#0ca30c', // 신선도 온라인 점
  up: '#e34948', // 상승 (한국 금융 관례: 빨강)
  down: '#2a78d6', // 하락 (파랑) — accent 역할은 폐기, 시장/카테고리 색으로만
  overlay: 'rgba(0,0,0,0.45)',
} as const;

export type Theme = { [K in keyof typeof palette]: string };

/** 라이트 고정 — 훅 형태는 유지해 호출부 변경을 최소화 */
export function useTheme(): { theme: Theme } {
  return { theme: palette };
}

/**
 * 두 hex 색을 섞는다 — CSS color-mix(in srgb, color pct, base) 대응.
 * mix('#4a2586', '#ffffff', 0.07) = 흰 바탕에 보라 7% 틴트.
 */
export function mix(color: string, base: string, pct: number): string {
  const c = parseHex(color);
  const b = parseHex(base);
  const ch = (i: number) => Math.round(b[i] + (c[i] - b[i]) * pct);
  return `#${[0, 1, 2].map((i) => ch(i).toString(16).padStart(2, '0')).join('')}`;
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** 흰 바탕 틴트 헬퍼 — 이슈 페이지(카테고리 7%)·스테디(액센트 6%)·델타 필(방향색 11%) 등 */
export function tint(color: string, pct: number): string {
  return mix(color, '#ffffff', pct);
}

/** 카테고리 색 — 검증된 카테고리컬 슬롯에 고정 매핑 (순서 임의 변경 금지, 신규는 끝에 추가) */
export const categoryColors: Record<Category, { color: string; label: string }> = {
  RATE: { color: '#2a78d6', label: '금리' },
  MACRO: { color: '#1baf7a', label: '경기' },
  POLICY: { color: '#4a3aa7', label: '정책' },
  FX: { color: '#eb6834', label: '환율' },
  GEO: { color: '#e34948', label: '지정학' },
  MARKET: { color: '#008300', label: '시장' },
  EARNINGS: { color: '#e87ba4', label: '실적' },
  COMMODITY: { color: '#a16a1f', label: '원자재' }, // v3: FX 에서 분리 (유가·금)
  ETC: { color: '#898781', label: '기타' },
  // v4 MVP 큐레이션 카테고리 — 검증된 기존 슬롯 색 재사용 (신구 코드는 한 피드에 공존 안 함)
  RATES: { color: '#2a78d6', label: '금리' },
  STOCKS: { color: '#008300', label: '주식' },
  CRYPTO: { color: '#a16a1f', label: '코인' },
  HOUSING: { color: '#1baf7a', label: '부동산' },
  AI_CHIPS: { color: '#4a3aa7', label: 'AI·반도체' },
  PRICES: { color: '#e87ba4', label: '물가·내 지갑' },
  FX_WORLD: { color: '#eb6834', label: '환율·세계' },
};

/** v4 시각자료 color role → 팔레트 색 (accent/up/down/gold/green/ink/muted) */
export function roleColor(role: string | undefined, theme: Theme): string {
  switch (role) {
    case 'up':
      return theme.up;
    case 'down':
      return theme.down;
    case 'gold':
      return '#a16a1f';
    case 'green':
      return '#1baf7a';
    case 'ink':
      return theme.text;
    case 'muted':
      return theme.textMuted;
    default:
      return theme.accent;
  }
}

function categoryEntry(category: Category | string) {
  return categoryColors[(category as Category) in categoryColors ? (category as Category) : 'ETC'];
}

export function categoryColor(category: Category | string): string {
  return categoryEntry(category).color;
}

export function categoryLabel(category: Category | string): string {
  return categoryEntry(category).label;
}

/** 전 카테고리 목록 — 칩 행·관심 분야 등에서 순서 고정으로 사용 */
export const allCategories = Object.keys(categoryColors) as Category[];

/**
 * 타입 스케일 (redesignspec §2) — 워드마크 26/900 · 히어로 스탯 40/800(tabular)
 * · 뷰어 제목 24/800 · 카드 제목 17/700 · 본문 15/400(lh 22–23) · 캡션 13 · 미세 11.
 */
export const typography = {
  wordmark: { fontSize: 26, ...font(900), letterSpacing: -0.5 },
  heroStat: { fontSize: 40, ...font(800), fontVariant: ['tabular-nums'] as ['tabular-nums'] },
  viewerTitle: { fontSize: 26, ...font(800), lineHeight: 34, letterSpacing: -0.5 },
  title: { fontSize: 20, ...font(700), lineHeight: 28, letterSpacing: -0.3 },
  cardTitle: { fontSize: 17, ...font(700), lineHeight: 24, letterSpacing: -0.2 },
  body: { fontSize: 15, ...font(400), lineHeight: 23 },
  caption: { fontSize: 13, ...font(400), lineHeight: 18 },
  micro: { fontSize: 11, ...font(400), lineHeight: 16 },
} as const;

/** 간격은 4/8/16/24/32 만 사용 */
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

/**
 * 카드 그림자 (iOS 느낌) — 면 분리를 헤어라인 대신 낮은 확산 그림자로.
 * Android 는 elevation 폴백. 배경색이 있는 View 에만 적용할 것.
 */
export const cardShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

/** 라운드 3단계: 카드/시트 16·20, 소형 컨트롤 12, 칩/필/배지 999 */
export const radius = { card: 16, sheet: 20, control: 12, pill: 999 } as const;

/** 모션: 시트 220ms 슬라이드업, 이슈 전환 260ms — 그 외 없음. press = opacity 0.7 */
export const motion = { sheet: 220, issue: 260 } as const;
