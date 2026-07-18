import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryBadge } from '@/components/common/CategoryBadge';
import { DeltaPill } from '@/components/common/DeltaPill';
import { copy } from '@/constants/copy';
import type { IssueCard as IssueCardType, PeriodTier } from '@/data/types';
import { font, radius, spacing, tint, typography, useTheme } from '@/theme';
import { relativeTime } from '@/utils/format';

const TIER_LABEL: Record<PeriodTier, string> = {
  weekly: copy.tierWeekly,
  monthly: copy.tierMonthly,
  yearly: copy.tierYearly,
};

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
  const tier = issue.period_tier;
  // 이번 주 이슈만 accent 강조 — 훑을 때 '지금 뉴스'가 먼저 보이게
  const tierHot = tier === 'weekly';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        read && styles.read,
        pressed && styles.pressed,
      ]}>
      {/* 발생일 — 모든 카드에서 우상단 고정 (v4: 축약 라벨 우선, 없으면 상대 시각) */}
      <Text style={[styles.time, { color: theme.textMuted }]}>
        {issue.date_label_short ?? relativeTime(issue.event_at ?? issue.last_update)}
      </Text>

      <View style={styles.row}>
        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <CategoryBadge category={issue.category} />
            {tier && (
              <View
                style={[
                  styles.tierChip,
                  {
                    backgroundColor: tierHot ? theme.accent : tint(theme.accent, 0.08),
                    borderColor: tierHot ? theme.accent : theme.border,
                  },
                ]}>
                <Text style={[styles.tierLabel, { color: tierHot ? theme.onAccent : theme.textSecondary }]}>
                  {TIER_LABEL[tier]}
                </Text>
              </View>
            )}
          </View>
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
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  tierChip: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierLabel: { fontSize: 11, ...font(700) },
  title: { ...typography.cardTitle, paddingRight: spacing.xl },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statValue: { fontSize: 14, ...font(700), fontVariant: ['tabular-nums'] },
  icon: { fontSize: 34, alignSelf: 'center', marginTop: 18 },
});
