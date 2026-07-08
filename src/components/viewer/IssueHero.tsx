import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { ChartCard } from '@/components/charts/ChartCard';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { GlossaryText } from '@/components/glossary/GlossaryText';
import type { IssueCard, IssueDetail } from '@/data/types';
import { spacing, typography, useTheme } from '@/theme';
import { relativeTime } from '@/utils/format';

interface Props {
  card: IssueCard;
  detail: IssueDetail | null; // 아직 로딩 전이면 null — 카드 데이터만으로도 렌더
  width: number;
}

/**
 * 이슈 뷰어 1페이지 — 한 줄 요약이 주인공.
 * 리스트 카드 데이터만으로 즉시 그려지고, 상세가 도착하면 글로서리·차트가 붙는다.
 */
export function IssueHero({ card, detail, width }: Props) {
  const { theme } = useTheme();
  const glossary = detail?.glossary ?? [];
  const whyNow = detail?.why_now ?? card.why_now;

  return (
    <View style={[styles.page, { width }]}>
      <View style={styles.topRow}>
        <CategoryBadge category={card.category} size="md" />
        <Text style={[styles.time, { color: theme.textMuted }]}>{relativeTime(card.last_update)}</Text>
      </View>

      <View style={styles.center}>
        <Text style={[styles.kicker, { color: theme.textSecondary }]} numberOfLines={2}>
          {card.title}
        </Text>
        <GlossaryText
          text={card.one_liner}
          glossary={glossary}
          style={[typography.hero, { color: theme.text }]}
        />
        {!!whyNow && (
          <View style={[styles.whyNow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={styles.whyNowEmoji}>💡</Text>
            <View style={styles.whyNowBody}>
              <Text style={[styles.whyNowLabel, { color: theme.textMuted }]}>왜 중요할까요?</Text>
              <GlossaryText
                text={whyNow}
                glossary={glossary}
                style={[styles.whyNowText, { color: theme.textSecondary }]}
              />
            </View>
          </View>
        )}
        {detail?.visual && <ChartCard visual={detail.visual} width={width - spacing.md * 2} />}
      </View>

      <View style={styles.bottomHint}>
        <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
        <Text style={[styles.hintText, { color: theme.textMuted }]}>옆으로 넘기면 자세한 내용</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  // 우상단 닫기 버튼(오버레이)과 겹치지 않게 오른쪽 여백 확보
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 44 },
  time: { ...typography.caption },
  center: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  kicker: { fontSize: 15, fontWeight: '600' },
  whyNow: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  whyNowEmoji: { fontSize: 18 },
  whyNowBody: { flex: 1, gap: 2 },
  whyNowLabel: { ...typography.caption, fontWeight: '700' },
  whyNowText: { fontSize: 15, lineHeight: 23 },
  bottomHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingBottom: spacing.sm },
  hintText: { ...typography.caption },
});
