import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/common/Card';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { HeroStat } from '@/components/common/HeroStat';
import { MiniChart } from '@/components/common/MiniChart';
import { GlossaryText } from '@/components/glossary/GlossaryText';
import { copy } from '@/constants/copy';
import type { IssueCard } from '@/data/types';
import { useIssue } from '@/data/useIssue';
import { categoryColor, font, radius, spacing, tint, typography, useTheme } from '@/theme';
import { relativeTime } from '@/utils/format';

import { DetailSheet } from './DetailSheet';

interface Props {
  card: IssueCard;
  isActive: boolean; // 현재±1 페이지만 상세 fetch
  width: number;
  height: number;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDetailOpenChange: (open: boolean) => void;
  onPressRelated: (id: string) => void;
}

/**
 * 이슈 한 페이지 = 히어로 단일 화면 + "더 알아보기" 바텀시트.
 * 배경은 카테고리 색 7% 틴트, 우상단에 이슈 아이콘을 크게 깔아 분위기를 만든다.
 * 기존 가로 2페이지(히어로↔더보기) 구조는 제거 — 제스처 축은 세로 하나.
 */
export function IssuePage({
  card,
  isActive,
  width,
  height,
  index,
  total,
  onPrev,
  onNext,
  onDetailOpenChange,
  onPressRelated,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { detail, error, retry } = useIssue(card.id, isActive);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    onDetailOpenChange(sheetOpen);
  }, [sheetOpen, onDetailOpenChange]);

  const handleRelated = useCallback(
    (id: string) => {
      setSheetOpen(false);
      onPressRelated(id);
    },
    [onPressRelated],
  );

  const glossary = detail?.glossary ?? [];
  const whyNow = detail?.why_now ?? card.why_now;
  const stat = card.headline_stat ?? detail?.headline_stat;
  const background = tint(categoryColor(card.category), 0.07);

  return (
    <View style={[styles.page, { width, height, backgroundColor: background }]}>
      {/* 히어로 배경 아이콘 — 항상 표시, 제목이 앞 (zIndex) */}
      {!!card.icon && (
        <Text style={styles.bgIcon} accessible={false}>
          {card.icon}
        </Text>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <CategoryBadge category={card.category} size="md" />
          <Text style={[styles.time, { color: theme.textMuted }]}>{relativeTime(card.last_update)}</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{card.title}</Text>

        {stat && <HeroStat stat={stat} />}

        <GlossaryText
          text={card.one_liner}
          glossary={glossary}
          style={[styles.oneLiner, { color: theme.textSecondary }]}
        />

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
      </ScrollView>

      {/* 하단 고정: 더 알아보기 + 위치 안내 + ↑↓ 보조 버튼 */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable
          onPress={() => setSheetOpen(true)}
          style={({ pressed }) => [
            styles.learnMore,
            { backgroundColor: theme.accent },
            pressed && { opacity: 0.7 },
          ]}>
          <Text style={[styles.learnMoreLabel, { color: theme.onAccent }]}>{copy.learnMore}</Text>
        </Pressable>
        <View style={styles.navRow}>
          <Text style={[styles.position, { color: theme.textMuted }]}>
            {copy.pagerPosition(index + 1, total)}
          </Text>
          <View style={styles.navButtons}>
            <Pressable
              onPress={onPrev}
              disabled={index === 0}
              hitSlop={8}
              style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }, index === 0 && styles.navDisabled]}>
              <Ionicons name="chevron-up" size={16} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={onNext}
              disabled={index === total - 1}
              hitSlop={8}
              style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }, index === total - 1 && styles.navDisabled]}>
              <Ionicons name="chevron-down" size={16} color={theme.text} />
            </Pressable>
          </View>
        </View>
      </View>

      <DetailSheet
        visible={sheetOpen}
        card={card}
        detail={detail}
        error={error}
        onRetry={retry}
        onClose={() => setSheetOpen(false)}
        onPressRelated={handleRelated}
        width={width}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { overflow: 'hidden' },
  // top 34 / right -18 / 160px / opacity 0.1 — 스크롤 컨테이너 밖(고정)에 둔다
  bgIcon: {
    position: 'absolute',
    top: 34,
    right: -18,
    fontSize: 160,
    lineHeight: 176,
    opacity: 0.1,
    zIndex: 0,
  },
  scroll: { flex: 1, zIndex: 1 },
  // paddingTop 48 = 페이저 상단 오버레이(진행 세그먼트+닫기)와 겹침 방지
  content: { paddingHorizontal: spacing.md, paddingTop: 48, paddingBottom: spacing.md, gap: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { ...typography.caption },
  title: { ...typography.viewerTitle },
  oneLiner: { fontSize: 16, lineHeight: 25, ...font(400) },
  whyNow: { flexDirection: 'row', gap: spacing.sm },
  whyNowEmoji: { fontSize: 18 },
  whyNowBody: { flex: 1, gap: 2 },
  whyNowLabel: { ...typography.caption, ...font(700) },
  bottom: { paddingHorizontal: spacing.md, gap: spacing.sm, zIndex: 1 },
  learnMore: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnMoreLabel: { fontSize: 16, ...font(700) },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  position: { ...typography.caption },
  navButtons: { flexDirection: 'row', gap: spacing.sm },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDisabled: { opacity: 0.4 },
});
