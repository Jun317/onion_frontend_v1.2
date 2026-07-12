import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import type { SteadyTableData } from '@/data/types';
import { font, spacing, typography, useTheme } from '@/theme';

/**
 * 스테디 핵심 수치 표 — 헤더 행 + 첫 열 라벨.
 * 모든 수치엔 출처 캡션을 함께 표기한다 (QA 규칙).
 */
export function SteadyTable({ table }: { table: SteadyTableData }) {
  const { theme } = useTheme();
  const showHeader = table.columns.some((c) => c.trim().length > 0);

  return (
    <Card style={styles.card}>
      {!!table.title && <Text style={[styles.title, { color: theme.text }]}>{table.title}</Text>}

      {showHeader && (
        <View style={[styles.row, styles.headerRow, { borderBottomColor: theme.hairline }]}>
          {table.columns.map((c, i) => (
            <Text
              key={i}
              style={[styles.cell, styles.headerCell, i === 0 && styles.labelCell, { color: theme.textMuted }]}>
              {c}
            </Text>
          ))}
        </View>
      )}

      {table.rows.map((row, ri) => (
        <View
          key={ri}
          style={[styles.row, ri > 0 && { borderTopColor: theme.hairline, borderTopWidth: StyleSheet.hairlineWidth }]}>
          {row.map((cell, ci) => (
            <Text
              key={ci}
              style={[
                styles.cell,
                ci === 0
                  ? [styles.labelCell, styles.labelText, { color: theme.textSecondary }]
                  : { color: theme.text },
              ]}>
              {cell}
            </Text>
          ))}
        </View>
      ))}

      {!!table.source && (
        <Text style={[styles.source, { color: theme.textMuted }]}>출처: {table.source}</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  title: { fontSize: 15, ...font(700), marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 8 },
  headerRow: { borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 0 },
  cell: { flex: 1.4, fontSize: 13, lineHeight: 19, ...font(400) },
  headerCell: { fontSize: 12, ...font(600) },
  labelCell: { flex: 1 },
  labelText: { ...font(600) },
  source: { ...typography.micro, marginTop: spacing.sm },
});
