import { ActivityIndicator, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { ChartCard } from '@/components/charts/ChartCard';
import { TableCard } from '@/components/charts/TableCard';
import { TimelineCard } from '@/components/charts/TimelineCard';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { ErrorView } from '@/components/common/StateViews';
import { DetailsSection, EffectRowsSection, TipsSection } from '@/components/detail/sections';
import { copy } from '@/constants/copy';
import type { IssueCard, IssueDetail, Visual } from '@/data/types';
import { font, spacing, typography, useTheme } from '@/theme';

interface Props {
  card: IssueCard;
  detail: IssueDetail | null;
  error: Error | null;
  onRetry: () => void;
  width: number;
  bottomInset: number; // 하단 고정 바 높이만큼 스크롤 여백
  snapStyle?: ViewStyle; // 웹 가로 스냅(자식 스냅 정지) — 가로 페이저에서 주입
}

/** kind 별 시각자료 라우팅 — chart(원본형)·table·timeline */
function VisualBlock({ visual, width }: { visual: Visual; width: number }) {
  const kind = visual.kind ?? 'chart';
  if (kind === 'table') return <TableCard visual={visual} width={width} />;
  if (kind === 'timeline') return <TimelineCard visual={visual} width={width} />;
  return <ChartCard visual={visual} width={width} />;
}

/**
 * 이슈 상세 페인 — 가로 페이저의 두 번째 페이지 (v4.1: Modal 시트 → 페이지 전환).
 * Modal 중첩(상세 시트 + 용어 시트)이 Android 에서 화면 프리즈를 일으켜 구조 자체를 바꿈.
 * 섹션 순서: 배지+제목 → 무슨 일 → 그래서 → 알아두면 좋아요 → 시각자료 → 면책.
 */
export function DetailPane({ card, detail, error, onRetry, width, bottomInset, snapStyle }: Props) {
  const { theme } = useTheme();

  if (error && !detail) {
    return (
      <View style={[styles.fill, { width }, snapStyle]}>
        <ErrorView message={copy.detailError} onRetry={onRetry} />
      </View>
    );
  }
  if (!detail) {
    return (
      <View style={[styles.fill, styles.loading, { width }, snapStyle]}>
        <ActivityIndicator color={theme.textMuted} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>{copy.detailLoading}</Text>
      </View>
    );
  }

  const visuals =
    detail.visuals && detail.visuals.length > 0
      ? detail.visuals
      : detail.visual
        ? [detail.visual]
        : [];
  const cardWidth = width - spacing.md * 2;

  return (
    <ScrollView
      style={[{ width }, snapStyle]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomInset + spacing.lg }]}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled>
      <View style={styles.headerRow}>
        <CategoryBadge category={card.category} />
        <Text style={[styles.header, { color: theme.text }]}>{card.title}</Text>
      </View>
      <DetailsSection details={detail.details} glossary={detail.glossary} />
      <EffectRowsSection
        rows={detail.effect_rows ?? []}
        effects={detail.effects}
        glossary={detail.glossary}
      />
      <TipsSection tips={detail.tips ?? []} glossary={detail.glossary} />
      {visuals.length > 0 && (
        <View style={styles.visuals}>
          <Text style={[styles.visualsTitle, { color: theme.textMuted }]}>
            {copy.sectionVisuals}
          </Text>
          {visuals.map((v, i) => (
            <VisualBlock key={v.id ?? i} visual={v} width={cardWidth} />
          ))}
        </View>
      )}
      <Text style={[styles.disclaimer, { color: theme.textMuted }]}>{copy.disclaimer}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { gap: spacing.sm },
  loadingText: { ...typography.caption },
  // paddingTop 48 = 페이저 상단 오버레이와 겹침 방지 (히어로와 동일)
  content: { paddingHorizontal: spacing.md, paddingTop: 48, gap: spacing.lg },
  headerRow: { gap: spacing.sm },
  header: { ...typography.title },
  visuals: { gap: spacing.sm },
  visualsTitle: { fontSize: 13, ...font(700), letterSpacing: 0.2 },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: spacing.md },
});
