import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { HeroStat } from '@/components/common/HeroStat';
import { MiniChart } from '@/components/common/MiniChart';
import { GlossaryText } from '@/components/glossary/GlossaryText';
import { copy } from '@/constants/copy';
import type { IssueCard, IssueDetail } from '@/data/types';
import { font, spacing, typography, useTheme } from '@/theme';
import { relativeTime } from '@/utils/format';

interface Props {
  card: IssueCard;
  detail: IssueDetail | null; // 아직 로딩 전이면 null — 카드 데이터만으로도 렌더
  width: number;
}

/**
 * 이슈 뷰어 1페이지 (히어로).
 * - 핵심 숫자가 있으면: 제목 24/800 → 대형 스탯 → one_liner 16 (숫자 우선)
 * - 없으면: 제목을 작은 키커로, one_liner 가 주인공 (24/800)
 * 세로 ScrollView 를 쓰지 않는다 — 세로 페이저와의 제스처 충돌 방지 (v1 검증 구조).
 */
export function IssueHero({ card, detail, width }: Props) {
  const { theme } = useTheme();
  const glossary = detail?.glossary ?? [];
  const whyNow = detail?.why_now ?? card.why_now;
  const stat = card.headline_stat ?? detail?.headline_stat;

  return (
    <View style={[styles.page, { width }]}>
      {/* 히어로 배경 아이콘 — 항상 표시, 터치는 통과 (제목이 앞) */}
      {!!card.icon && (
        <Text style={styles.bgIcon} pointerEvents="none" accessible={false}>
          {card.icon}
        </Text>
      )}

      <View style={styles.content}>
        <View style={styles.topRow}>
          <CategoryBadge category={card.category} size="md" />
          <Text style={[styles.time, { color: theme.textMuted }]}>{relativeTime(card.last_update)}</Text>
        </View>

        {stat ? (
          <>
            <Text style={[styles.title, { color: theme.text }]}>{card.title}</Text>
            <HeroStat stat={stat} />
            <GlossaryText
              text={card.one_liner}
              glossary={glossary}
              style={[styles.oneLiner, { color: theme.textSecondary }]}
            />
          </>
        ) : (
          <>
            <Text style={[styles.kicker, { color: theme.textSecondary }]} numberOfLines={2}>
              {card.title}
            </Text>
            <GlossaryText
              text={card.one_liner}
              glossary={glossary}
              style={[styles.title, { color: theme.text }]}
            />
          </>
        )}

        {detail?.visual && <MiniChart visual={detail.visual} width={width - spacing.md * 2} />}

        {!!whyNow && (
          <Card style={styles.whyNow}>
            <Text style={styles.whyNowEmoji}>💡</Text>
            <View style={styles.whyNowBody}>
              <Text style={[styles.whyNowLabel, { color: theme.textMuted }]}>{copy.whyNow}</Text>
              <GlossaryText
                text={whyNow}
                glossary={glossary}
                style={[typography.body, { color: theme.textSecondary }]}
              />
            </View>
          </Card>
        )}
      </View>

      <View style={styles.bottomHint}>
        <Text style={[styles.hintText, { color: theme.textMuted }]}>{copy.swipeDetailHint}</Text>
        <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, overflow: 'hidden' },
  // top 34 / right -18 / 160px / opacity 0.1 (redesignspec §4-2)
  bgIcon: {
    position: 'absolute',
    top: 34,
    right: -18,
    fontSize: 160,
    lineHeight: 176,
    opacity: 0.1,
    zIndex: 0,
  },
  // paddingTop 48 = 페이저 상단 오버레이(진행 세그먼트+닫기)와 겹침 방지
  content: { flex: 1, paddingHorizontal: spacing.md, paddingTop: 48, gap: spacing.md, zIndex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { ...typography.caption },
  kicker: { fontSize: 15, ...font(600) },
  title: { ...typography.viewerTitle },
  oneLiner: { fontSize: 16, lineHeight: 25, ...font(400) },
  whyNow: { flexDirection: 'row', gap: spacing.sm },
  whyNowEmoji: { fontSize: 18 },
  whyNowBody: { flex: 1, gap: 2 },
  whyNowLabel: { ...typography.caption, ...font(700) },
  bottomHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.md,
    zIndex: 1,
  },
  hintText: { ...typography.caption },
});
