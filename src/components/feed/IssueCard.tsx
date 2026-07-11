import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryBadge } from '@/components/common/CategoryBadge';
import { DeltaPill } from '@/components/common/DeltaPill';
import type { IssueCard as IssueCardType } from '@/data/types';
import { font, radius, spacing, typography, useTheme } from '@/theme';
import { relativeTime } from '@/utils/format';

interface Props {
  issue: IssueCardType;
  read: boolean;
  onPress: () => void;
}

/**
 * 이슈 리스트 카드 v2 — 제목 + (있을 때만) 핵심 숫자 + 델타 필.
 * one_liner 는 카드에서 제거 (요약은 이슈 페이지에서). 우측 아이콘이 유일한 시각자료.
 * 읽은 이슈는 카드 전체 딜링 — stale 포함 전부 평등 표시.
 */
export function IssueCard({ issue, read, onPress }: Props) {
  const { theme } = useTheme();
  const stat = issue.headline_stat;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        read && styles.read,
        pressed && styles.pressed,
      ]}>
      {/* 생성 시간 — 모든 카드에서 우상단 고정 */}
      <Text style={[styles.time, { color: theme.textMuted }]}>{relativeTime(issue.last_update)}</Text>

      <View style={styles.row}>
        <View style={styles.content}>
          <CategoryBadge category={issue.category} />
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
            {issue.title}
          </Text>
          {stat && (
            <View style={styles.statRow}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {stat.value}
                {stat.unit}
              </Text>
              {!!stat.delta_text && <DeltaPill text={stat.delta_text} direction={stat.direction} />}
            </View>
          )}
        </View>
        {!!issue.icon && <Text style={styles.icon}>{issue.icon}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  pressed: { opacity: 0.7 },
  read: { opacity: 0.45 },
  time: { position: 'absolute', top: spacing.md, right: spacing.md, ...typography.caption },
  row: { flexDirection: 'row', gap: spacing.sm },
  content: { flex: 1, gap: spacing.sm },
  title: { ...typography.cardTitle, paddingRight: spacing.xl },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statValue: { fontSize: 14, ...font(700), fontVariant: ['tabular-nums'] },
  icon: { fontSize: 34, alignSelf: 'center', marginTop: 18 },
});
