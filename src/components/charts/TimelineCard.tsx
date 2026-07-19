import { StyleSheet, Text, View } from 'react-native';

import type { Visual } from '@/data/types';
import { cardShadow, font, radius, spacing, tint, typography, useTheme } from '@/theme';

interface Props {
  visual: Visual; // kind === 'timeline' (entries 보장, normalizeVisual 통과분)
  width: number;
}

/** 타임라인 시각자료 — 날짜 볼드 + 본문, hot 행은 붉은 틴트 강조. */
export function TimelineCard({ visual, width }: Props) {
  const { theme } = useTheme();
  const entries = visual.entries ?? [];
  if (entries.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, width }]}>
      <Text style={[styles.title, { color: theme.text }]}>{visual.title}</Text>
      {entries.map((e, i) => (
        <View
          key={i}
          style={[
            styles.row,
            e.hot && { backgroundColor: tint(theme.up, 0.08), borderRadius: radius.control },
          ]}>
          <View style={[styles.dot, { backgroundColor: e.hot ? theme.up : theme.accent }]} />
          <View style={styles.body}>
            <Text style={[styles.date, { color: e.hot ? theme.up : theme.accent }]}>
              {e.date_label}
            </Text>
            <Text style={[styles.text, { color: theme.textSecondary }]}>{e.text}</Text>
          </View>
        </View>
      ))}
      {!!visual.source && (
        <Text style={[styles.source, { color: theme.textMuted }]}>출처: {visual.source}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    padding: spacing.md,
    ...cardShadow,
    gap: spacing.xs,
  },
  title: { fontSize: 15, ...font(700), marginBottom: 2 },
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 8, paddingHorizontal: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  body: { flex: 1, gap: 1 },
  date: { ...typography.micro, ...font(700) },
  text: { fontSize: 13, lineHeight: 19 },
  source: { fontSize: 11, marginTop: 2 },
});
