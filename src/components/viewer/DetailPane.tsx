import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChartCard } from '@/components/charts/ChartCard';
import { ErrorView } from '@/components/common/StateViews';
import {
  AnchorsSection,
  DetailsSection,
  EffectsSection,
  HeadlinesSection,
  RelatedSection,
  TimelineSection,
} from '@/components/detail/sections';
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

/** 이슈 뷰어 2페이지 "더보기" — 구체적 내용·수치·흐름·원문 */
export function DetailPane({ card, detail, error, onRetry, onPressRelated, width }: Props) {
  const { theme } = useTheme();

  if (error && !detail) {
    return (
      <View style={[styles.pane, { width }]}>
        <ErrorView message="자세한 내용을 불러오지 못했어요" onRetry={onRetry} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.pane, styles.loading, { width }]}>
        <ActivityIndicator color={theme.textMuted} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>자세한 내용을 가져오고 있어요</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ width }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled>
      <Text style={[styles.header, { color: theme.text }]}>{card.title}</Text>
      <DetailsSection details={detail.details} glossary={detail.glossary} />
      <EffectsSection effects={detail.effects} glossary={detail.glossary} />
      <AnchorsSection anchors={detail.anchors} />
      {detail.visual && <ChartCard visual={detail.visual} width={width - spacing.md * 2} />}
      <TimelineSection timeline={detail.timeline} />
      <HeadlinesSection headlines={detail.headlines} />
      <RelatedSection related={detail.related} onPressIssue={onPressRelated} />
      <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
        본 콘텐츠는 투자 판단의 근거가 아닙니다.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pane: { flex: 1 },
  loading: { alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { ...typography.caption },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.lg },
  header: { ...typography.title },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: spacing.md },
});
