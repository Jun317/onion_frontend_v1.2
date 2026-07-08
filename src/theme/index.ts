import { useColorScheme } from 'react-native';

import type { Category } from '@/data/types';

/** dataviz 레퍼런스 팔레트 기반 — 라이트/다크 각각 검증된 스텝 사용 */
export const palette = {
  light: {
    background: '#f9f9f7', // 페이지
    surface: '#fcfcfb', // 카드·차트
    text: '#0b0b0b',
    textSecondary: '#52514e',
    textMuted: '#898781',
    hairline: '#e1e0d9',
    axis: '#c3c2b7',
    border: 'rgba(11,11,11,0.10)',
    accent: '#2a78d6', // 링크·글로서리 용어·기본 시리즈
    up: '#e34948', // 상승 (한국 금융 관례: 빨강)
    down: '#2a78d6', // 하락 (파랑)
    overlay: 'rgba(0,0,0,0.45)',
  },
  dark: {
    background: '#0d0d0d',
    surface: '#1a1a19',
    text: '#ffffff',
    textSecondary: '#c3c2b7',
    textMuted: '#898781',
    hairline: '#2c2c2a',
    axis: '#383835',
    border: 'rgba(255,255,255,0.10)',
    accent: '#3987e5',
    up: '#e66767',
    down: '#3987e5',
    overlay: 'rgba(0,0,0,0.6)',
  },
} as const;

export type Theme = { [K in keyof (typeof palette)['light']]: string };

/** 카테고리 8색 — 검증된 카테고리컬 슬롯에 고정 매핑 (순서 임의 변경 금지) */
export const categoryColors: Record<Category, { light: string; dark: string; label: string }> = {
  RATE: { light: '#2a78d6', dark: '#3987e5', label: '금리' },
  MACRO: { light: '#1baf7a', dark: '#199e70', label: '경기' },
  POLICY: { light: '#4a3aa7', dark: '#9085e9', label: '정책' },
  FX: { light: '#eb6834', dark: '#d95926', label: '환율' },
  GEO: { light: '#e34948', dark: '#e66767', label: '지정학' },
  MARKET: { light: '#008300', dark: '#008300', label: '시장' },
  EARNINGS: { light: '#e87ba4', dark: '#d55181', label: '실적' },
  ETC: { light: '#898781', dark: '#898781', label: '기타' },
};

export function useTheme(): { theme: Theme; scheme: 'light' | 'dark' } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { theme: palette[scheme], scheme };
}

export function categoryColor(category: Category | string, scheme: 'light' | 'dark'): string {
  const entry = categoryColors[(category as Category) in categoryColors ? (category as Category) : 'ETC'];
  return entry[scheme];
}

export function categoryLabel(category: Category | string): string {
  const entry = categoryColors[(category as Category) in categoryColors ? (category as Category) : 'ETC'];
  return entry.label;
}

export const typography = {
  hero: { fontSize: 32, fontWeight: '800' as const, lineHeight: 44 },
  title: { fontSize: 20, fontWeight: '700' as const, lineHeight: 28 },
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 27 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
