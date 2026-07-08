import type { GlossaryEntry } from '@/data/types';

export interface Segment {
  text: string;
  entry: GlossaryEntry | null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 텍스트를 용어 사전과 대조해 세그먼트로 분해.
 * 긴 용어 우선 매칭("기준금리" 안의 "금리" 중복 방지)을 위해 길이 내림차순 정렬.
 */
export function splitByTerms(text: string, glossary: GlossaryEntry[]): Segment[] {
  if (!text || glossary.length === 0) return [{ text, entry: null }];
  const terms = [...glossary]
    .filter((g) => g.term && g.term.length > 0)
    .sort((a, b) => b.term.length - a.term.length);
  if (terms.length === 0) return [{ text, entry: null }];

  const pattern = new RegExp(`(${terms.map((t) => escapeRegExp(t.term)).join('|')})`, 'g');
  const byTerm = new Map(terms.map((t) => [t.term, t]));

  return text
    .split(pattern)
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, entry: byTerm.get(part) ?? null }));
}
