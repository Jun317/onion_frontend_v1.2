import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cacheKeys, readCache, writeCache } from '@/data/cache';
import type { IssueCard } from '@/data/types';
import { usePrefs } from '@/lib/store';
import { copy } from '@/constants/copy';
import { cardShadow, font, radius, spacing, useTheme } from '@/theme';

import { IssuePage } from './IssuePage';

interface Props {
  issues: IssueCard[];
  initialIndex: number;
  onClose: () => void;
}

/** ↑↓ 보조 버튼 연타 방지 쿨다운 (ms) */
const NAV_COOLDOWN_MS = 550;
/** 이슈 수가 이보다 많으면 세그먼트 대신 연속 진행 바로 폴백 */
const MAX_SEGMENTS = 20;

// react-native-web 전용 CSS 스크롤 스냅 — 브라우저가 한 스와이프/휠에 이슈 한 개씩 스냅하도록.
// (RN 의 snapToInterval·disableIntervalMomentum 은 웹에서 네이티브처럼 동작하지 않음)
const WEB_SNAP_CONTAINER =
  Platform.OS === 'web' ? ({ scrollSnapType: 'y mandatory' } as unknown as ViewStyle) : undefined;
const WEB_SNAP_CHILD =
  Platform.OS === 'web'
    ? ({ scrollSnapAlign: 'start', scrollSnapStop: 'always' } as unknown as ViewStyle)
    : undefined;

/** 스토리형 진행 표시 — 지난 = accent-soft · 현재 = accent · 이후 = hairline */
function ProgressSegments({ active, total }: { active: number; total: number }) {
  const { theme } = useTheme();
  if (total <= 1) return null;
  if (total > MAX_SEGMENTS) {
    return (
      <View style={[styles.progressTrack, { backgroundColor: theme.hairline }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: theme.accent, width: `${((active + 1) / total) * 100}%` },
          ]}
        />
      </View>
    );
  }
  return (
    <View style={styles.segments}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            {
              backgroundColor:
                i === active ? theme.accent : i < active ? theme.accentSoft : theme.hairline,
            },
          ]}
        />
      ))}
    </View>
  );
}

/**
 * 숏폼식 세로 페이저 — 제스처 축은 세로 하나 (위/아래 = 이전/다음 이슈).
 * 더 알아보기 시트가 열려 있는 동안은 세로 스크롤 잠금 (제스처 충돌 방지).
 * 페이지에 들어온 이슈는 읽음 처리한다.
 */
export function IssuePager({ issues, initialIndex, onClose }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { markRead } = usePrefs();
  const listRef = useRef<FlatList<IssueCard>>(null);
  const lastNavAt = useRef(0);
  const didInitialScroll = useRef(false);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [verticalLocked, setVerticalLocked] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    (async () => {
      const seen = await readCache<boolean>(cacheKeys.hintSeen);
      if (!seen?.data) setShowHint(true);
    })();
  }, []);

  // 뷰어에 노출된 이슈 = 읽음
  useEffect(() => {
    const id = issues[activeIndex]?.id;
    if (id) markRead(id);
  }, [activeIndex, issues, markRead]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    writeCache(cacheKeys.hintSeen, true);
  }, []);

  const scrollTo = useCallback(
    (index: number) => {
      const now = Date.now();
      if (now - lastNavAt.current < NAV_COOLDOWN_MS) return;
      lastNavAt.current = now;
      listRef.current?.scrollToIndex({ index, animated: true });
    },
    [],
  );
  const goPrev = useCallback(() => {
    if (activeIndex > 0) scrollTo(activeIndex - 1);
  }, [activeIndex, scrollTo]);
  const goNext = useCallback(() => {
    if (activeIndex < issues.length - 1) scrollTo(activeIndex + 1);
  }, [activeIndex, issues.length, scrollTo]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems.find((v) => v.isViewable);
      if (first?.index != null) setActiveIndex(first.index);
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.background }]}
      onLayout={(e) => setSize(e.nativeEvent.layout)}>
      {size && (
        <FlatList
          ref={listRef}
          data={issues}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={[{ paddingTop: insets.top, height: size.height }, WEB_SNAP_CHILD]}>
              <IssuePage
                card={item}
                isActive={Math.abs(index - activeIndex) <= 1}
                width={size.width}
                height={size.height - insets.top}
                index={index}
                total={issues.length}
                onPrev={goPrev}
                onNext={goNext}
                onDetailOpenChange={setVerticalLocked}
              />
            </View>
          )}
          style={WEB_SNAP_CONTAINER}
          pagingEnabled
          decelerationRate="fast"
          snapToInterval={size.height}
          disableIntervalMomentum
          showsVerticalScrollIndicator={false}
          scrollEnabled={!verticalLocked}
          initialScrollIndex={Math.min(initialIndex, issues.length - 1)}
          getItemLayout={(_, index) => ({
            length: size.height,
            offset: size.height * index,
            index,
          })}
          // react-native-web 는 initialScrollIndex 를 무시한다 → 콘텐츠 크기 확정 시점에
          // 탭한 이슈 위치로 1회 명령형 스크롤(웹). getItemLayout 덕에 오프셋 계산이 정확.
          onContentSizeChange={() => {
            if (Platform.OS !== 'web' || didInitialScroll.current) return;
            const target = Math.min(initialIndex, issues.length - 1);
            didInitialScroll.current = true;
            if (target > 0) {
              listRef.current?.scrollToOffset({ offset: target * size.height, animated: false });
            }
          }}
          windowSize={3}
          maxToRenderPerBatch={2}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}

      {/* 상단 오버레이 — 진행 세그먼트 + 닫기 (항상 우상단) */}
      <View style={[styles.topOverlay, { top: insets.top + spacing.sm }]}>
        <ProgressSegments active={activeIndex} total={issues.length} />
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={[styles.closeButton, { backgroundColor: theme.surface }]}>
          <Ionicons name="close" size={18} color={theme.text} />
        </Pressable>
      </View>

      {/* 첫 진입 1회 제스처 힌트 */}
      {showHint && (
        <Pressable style={[styles.hintOverlay, { backgroundColor: theme.overlay }]} onPress={dismissHint}>
          <View style={[styles.hintCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.hintLine, { color: theme.text }]}>{copy.viewerHintLine}</Text>
            <Text style={[styles.hintDismiss, { color: theme.textMuted }]}>{copy.viewerHintDismiss}</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  segments: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 2.5, borderRadius: 2 },
  progressTrack: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 2 },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  hintOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintCard: {
    borderRadius: radius.sheet,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  hintLine: { fontSize: 17, ...font(700) },
  hintDismiss: { fontSize: 13, marginTop: spacing.sm },
});
