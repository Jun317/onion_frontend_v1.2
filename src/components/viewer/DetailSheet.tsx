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
import { motion, radius, spacing, typography, useTheme } from '@/theme';

interface Props {
  visible: boolean;
  card: IssueCard;
  detail: IssueDetail | null;
  error: Error | null;
  onRetry: () => void;
  onClose: () => void;
  onPressRelated: (id: string) => void;
  width: number;
}

/**
 * "더 알아보기" 바텀시트 — 기존 가로 2페이지(더보기 페인)를 대체.
 * 92% 높이 · 상단 라운드 20 · 드래그 핸들 · 220ms slide-up (용어 시트와 동일한 모달 문법).
 * 섹션 순서 고정: 배지+제목 → 무슨 일 → 그래서 → 숫자 → 흐름 → 기사 → 같이 보면 → 면책.
 */
export function DetailSheet({ visible, card, detail, error, onRetry, onClose, onPressRelated, width }: Props) {
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
              <EffectsSection effects={detail.effects} glossary={detail.glossary} />
              <AnchorsSection anchors={detail.anchors} />
              {detail.visual && <ChartCard visual={detail.visual} width={width - spacing.md * 2} />}
              <TimelineSection timeline={detail.timeline} />
              <HeadlinesSection headlines={detail.headlines} />
              <RelatedSection related={detail.related} onPressIssue={onPressRelated} />
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
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: spacing.md },
});
