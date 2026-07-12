import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChartCard } from '@/components/charts/ChartCard';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { ErrorView } from '@/components/common/StateViews';
import {
  AnchorsSection,
  DetailsSection,
  EffectsSection,
  HeadlinesSection,
  RelatedSection,
  TimelineSection,
} from '@/components/detail/sections';
import { copy } from '@/constants/copy';
import type { IssueCard, IssueDetail } from '@/data/types';
import { spacing, typography, useTheme } from '@/theme';

interface Props {
  card: IssueCard;
  detail: IssueDetail | null;
  error: Error | null;
  onRetry: () => void;
  onPressRelated: (id: string) => void;
  width: number;
}

/**
 * 이슈 뷰어 2페이지 "자세한 내용" — 옆으로 스와이프해서 진입 (Modal 아님).
 * 섹션 순서 고정: 배지+제목 → 무슨 일 → 그래서 → 숫자 → 차트 → 흐름 → 기사 → 같이 보면 → 면책.
 */
export function DetailPane({ card, detail, error, onRetry, onPressRelated, width }: Props) {
  const { theme } = useTheme();

  if (error && !detail) {
    return (
      <View style={[styles.pane, { width }]}>
        <ErrorView message={copy.detailError} onRetry={onRetry} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.pane, styles.loading, { width }]}>
        <ActivityIndicator color={theme.textMuted} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>{copy.detailLoading}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled>
      <View style={styles.headerRow}>
        <CategoryBadge category={card.category} />
        <Text style={[styles.header, { color: theme.text }]}>{card.title}</Text>
      </View>
      <DetailsSection details={detail.details} glossary={detail.glossary} />
      <EffectsSection effects={detail.effects} glossary={detail.glossary} />
      <AnchorsSection anchors={detail.anchors} />
      {detail.visual && <ChartCard visual={detail.visual} width={width - spacing.md * 2} />}
      <TimelineSection timeline={detail.timeline} />
      <HeadlinesSection headlines={detail.headlines} />
      <RelatedSection related={detail.related} onPressIssue={onPressRelated} />
      <Text style={[styles.disclaimer, { color: theme.textMuted }]}>{copy.disclaimer}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1 },
  loading: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { ...typography.caption },
  // paddingTop 48 = 페이저 상단 오버레이와 겹침 방지
  content: { padding: spacing.md, paddingTop: 48, paddingBottom: spacing.xl * 2, gap: spacing.lg },
  headerRow: { gap: spacing.sm },
  header: { ...typography.title },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: spacing.md },
});
