import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryBadge } from '@/components/common/CategoryBadge';
import type { IssueCard as IssueCardType } from '@/data/types';
import { spacing, typography, useTheme } from '@/theme';
import { relativeTime } from '@/utils/format';

interface Props {
  issue: IssueCardType;
  rank: number; // 현재 정렬 기준에서의 순위 (0-base)
  onPress: () => void;
}

/** 이슈 리스트 카드 — 제목 중심, stale 은 흐리게 */
export const IssueCard = memo(function IssueCard({ issue, rank, onPress }: Props) {
  const { theme } = useTheme();
  const isStale = issue.status === 'stale';
  const isTop = rank < 3 && !isStale;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
        isStale && styles.stale,
      ]}>
      <View style={styles.topRow}>
        <CategoryBadge category={issue.category} />
        {isTop && <Text style={styles.fire}>🔥</Text>}
        <View style={styles.spacer} />
        {issue.has_visual && <Ionicons name="stats-chart" size={14} color={theme.textMuted} />}
        <Text style={[styles.time, { color: theme.textMuted }]}>{relativeTime(issue.last_update)}</Text>
      </View>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
        {issue.title}
      </Text>
      <Text style={[styles.oneLiner, { color: theme.textSecondary }]} numberOfLines={1}>
        {issue.one_liner}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  stale: { opacity: 0.55 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fire: { fontSize: 13 },
  spacer: { flex: 1 },
  time: { ...typography.caption },
  title: { ...typography.title },
  oneLiner: { fontSize: 15, lineHeight: 22 },
});
