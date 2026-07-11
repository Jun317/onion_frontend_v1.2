import { useMemo } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import type { SteadyRef } from '@/data/types';
import { font, useTheme } from '@/theme';

interface Props {
  text: string;
  refs?: SteadyRef[];
  style?: StyleProp<TextStyle>;
  onPressRef: (issueId: string) => void;
}

interface Segment {
  text: string;
  issueId?: string;
}

/** refs 의 phrase 위치를 찾아 세그먼트로 분해 — phrase 는 text 에 포함된다는 계약(백엔드 검증) */
function splitByRefs(text: string, refs: SteadyRef[]): Segment[] {
  const hits = refs
    .map((r) => ({ index: text.indexOf(r.phrase), phrase: r.phrase, issueId: r.issue_id }))
    .filter((h) => h.index >= 0)
    .sort((a, b) => a.index - b.index);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const h of hits) {
    if (h.index < cursor) continue; // 겹치는 참조는 앞선 것 우선
    if (h.index > cursor) segments.push({ text: text.slice(cursor, h.index) });
    segments.push({ text: h.phrase, issueId: h.issueId });
    cursor = h.index + h.phrase.length;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

/** 스테디 상세 문단 — 이슈 언급을 accent 밑줄 링크로, 탭하면 해당 이슈 뷰어가 위에 열린다 */
export function LinkedText({ text, refs = [], style, onPressRef }: Props) {
  const { theme } = useTheme();
  const segments = useMemo(() => splitByRefs(text, refs), [text, refs]);

  return (
    <Text style={style}>
      {segments.map((seg, i) =>
        seg.issueId ? (
          <Text
            key={i}
            suppressHighlighting
            style={{ color: theme.accent, textDecorationLine: 'underline', ...font(600) }}
            onPress={() => onPressRef(seg.issueId!)}>
            {seg.text}
          </Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        ),
      )}
    </Text>
  );
}
