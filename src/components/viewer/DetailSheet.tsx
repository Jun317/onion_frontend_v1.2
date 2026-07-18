import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChartCard } from '@/components/charts/ChartCard';
import { TableCard } from '@/components/charts/TableCard';
import { TimelineCard } from '@/components/charts/TimelineCard';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { ErrorView } from '@/components/common/StateViews';
import { DetailsSection, EffectRowsSection, TipsSection } from '@/components/detail/sections';
import { copy } from '@/constants/copy';
import type { IssueCard, IssueDetail, Visual } from '@/data/types';
import { motion, radius, spacing, typography, useTheme } from '@/theme';

interface Props {
  visible: boolean;
  card: IssueCard;
  detail: IssueDetail | null;
  error: Error | null;
  onRetry: () => void;
  onClose: () => void;
  width: number;
}

/** kind 별 시각자료 라우팅 — chart(원본형)·table·timeline */
function VisualBlock({ visual, width }: { visual: Visual; width: number }) {
  const kind = visual.kind ?? 'chart';
  if (kind === 'table') return <TableCard visual={visual} width={width} />;
  if (kind === 'timeline') return <TimelineCard visual={visual} width={width} />;
  return <ChartCard visual={visual} width={width} />;
}

/**
 * "더 알아보기" 바텀시트 — 92% 높이 · 상단 라운드 20 · 드래그 핸들 · 220ms slide-up.
 * 섹션 순서 고정: 배지+제목 → 무슨 일 → 그래서(정보별 행) → 알아두면 좋아요
 * → 시각자료 원본(대표+추가: 차트·표·타임라인) → 면책.
 * (지금까지 흐름·실제 기사·같이 보면 좋아요·숫자로 보면은 v4 에서 제거 — 소비 빈도 낮음)
 */
export function DetailSheet({ visible, card, detail, error, onRetry, onClose, width }: Props) {
  const { theme } = useTheme();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slide.setValue(0);
      Animated.timing(slide, { toValue: 1, duration: motion.sheet, useNativeDriver: true }).start();
    }
  }, [visible, slide]);

  if (!visible) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [120, 0] });

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ translateY }] },
          ]}
          // 시트 내부 탭이 backdrop 닫기로 전파되지 않게
          onStartShouldSetResponder={() => true}>
          <Pressable onPress={onClose} hitSlop={10}>
            <View style={[styles.grabber, { backgroundColor: theme.hairline }]} />
          </Pressable>

          {error && !detail ? (
            <ErrorView message={copy.detailError} onRetry={onRetry} />
          ) : !detail ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.textMuted} />
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>{copy.detailLoading}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
              {(() => {
                const visuals =
                  detail.visuals && detail.visuals.length > 0
                    ? detail.visuals
                    : detail.visual
                      ? [detail.visual]
                      : [];
                if (visuals.length === 0) return null;
                return (
                  <View style={styles.visuals}>
                    <Text style={[styles.visualsTitle, { color: theme.text }]}>
                      {copy.sectionVisuals}
                    </Text>
                    {visuals.map((v, i) => (
                      <VisualBlock key={v.id ?? i} visual={v} width={width - spacing.md * 2} />
                    ))}
                  </View>
                );
              })()}
              <Text style={[styles.disclaimer, { color: theme.textMuted }]}>{copy.disclaimer}</Text>
            </ScrollView>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    height: '92%',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: spacing.sm },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingText: { ...typography.caption },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2, gap: spacing.lg },
  headerRow: { gap: spacing.sm },
  header: { ...typography.title },
  visuals: { gap: spacing.sm },
  visualsTitle: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: spacing.md },
});
