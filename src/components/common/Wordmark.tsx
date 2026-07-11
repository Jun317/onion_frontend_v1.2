import { StyleSheet, Text } from 'react-native';

import { typography, useTheme } from '@/theme';

/** 탭 헤더 워드마크 — onion / steady / my (26/900, 영문 소문자, accent 보라) */
export function Wordmark({ text }: { text: 'onion' | 'steady' | 'my' }) {
  const { theme } = useTheme();
  return <Text style={[styles.mark, { color: theme.accent }]}>{text}</Text>;
}

const styles = StyleSheet.create({
  mark: { ...typography.wordmark },
});
