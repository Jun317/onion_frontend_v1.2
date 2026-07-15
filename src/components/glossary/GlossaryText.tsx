import { useMemo } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import type { GlossaryEntry } from '@/data/types';
import { font, useTheme } from '@/theme';

import { useGlossary } from './GlossaryContext';
import { splitByTerms } from './parse';

interface Props {
  text: string;
  glossary: GlossaryEntry[];
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

/**
 * 해설 있는 용어를 강조색 + 점선 밑줄로 렌더 — 탭하면 해설 시트가 열린다.
 * 밑줄은 "탭 가능" 어포던스: 단순 강조(볼드)와 시각적으로 구분한다 (검증 보고서 P1).
 */
export function GlossaryText({ text, glossary, style, numberOfLines }: Props) {
  const { theme } = useTheme();
  const { open } = useGlossary();
  const segments = useMemo(() => splitByTerms(text, glossary), [text, glossary]);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((seg, i) =>
        seg.entry ? (
          <Text
            key={i}
            suppressHighlighting
            style={{
              color: theme.accent,
              ...font(700),
              textDecorationLine: 'underline',
              textDecorationStyle: 'dotted', // Android 는 실선으로 렌더 — 허용
              textDecorationColor: theme.accent,
            }}
            onPress={() => open(seg.entry!)}>
            {seg.text}
          </Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        ),
      )}
    </Text>
  );
}
