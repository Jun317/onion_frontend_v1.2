import { StyleSheet, Text, View } from 'react-native';

import type { Visual } from '@/data/types';
import { cardShadow, font, radius, spacing, typography, useTheme } from '@/theme';

interface Props {
  visual: Visual; // kind === 'table' (columns + rows 보장, normalizeVisual 통과분)
  width: number;
}

/** 표 시각자료 — 제목 + 헤더 행 + 데이터 행 + 출처. 2열(키-값)·3열 모두 지원. */
export function TableCard({ visual, width }: Props) {
  const { theme } = useTheme();
  const columns = visual.columns ?? [];
  const rows = visual.rows ?? [];
  if (columns.length === 0 || rows.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, width }]}>
      <Text style={[styles.title, { color: theme.text }]}>{visual.title}</Text>
      <View style={[styles.headerRow, { borderBottomColor: theme.hairline }]}>
        {columns.map((c, i) => (
          <Text
            key={i}
            style={[styles.headerCell, { color: theme.textMuted }, i === 0 && styles.firstCol]}>
            {c}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View
          key={ri}
          style={[styles.row, ri > 0 && { borderTopColor: theme.hairline, borderTopWidth: StyleSheet.hairlineWidth }]}>
          {row.map((cell, ci) => (
            <Text
              key={ci}
              style={[
                styles.cell,
                { color: ci === 0 ? theme.text : theme.textSecondary },
                ci === 0 && styles.firstCol,
                ci === 0 && font(600),
              ]}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
      {!!visual.note && <Text style={[styles.note, { color: theme.textMuted }]}>{visual.note}</Text>}
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
  headerRow: { flexDirection: 'row', gap: spacing.sm, paddingBottom: 6, borderBottomWidth: 1 },
  headerCell: { flex: 1.6, ...typography.micro, ...font(700) },
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 8 },
  cell: { flex: 1.6, fontSize: 13, lineHeight: 19 },
  firstCol: { flex: 1 },
  note: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  source: { fontSize: 11, marginTop: 2 },
});
