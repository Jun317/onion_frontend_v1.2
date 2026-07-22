import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

// react-native-web 전용 CSS 스크롤 스냅 — 브라우저(모바일 Safari 포함)가 한 스와이프에
// 이슈 한 개씩 스냅하도록. 웹에선 이 CSS 만 사용하고 RN JS 페이징 props 는 끈다(경합 방지).
// scrollBehavior:auto → 초기 위치 설정 시 애니메이션(촤라락) 없이 즉시 이동.
const WEB_SNAP_CONTAINER =
  Platform.OS === 'web'
    ? ({ scrollSnapType: 'y mandatory', scrollBehavior: 'auto' } as unknown as ViewStyle)
    : undefined;
const WEB_SNAP_CHILD =
  Platform.OS === 'web'
    ? ({ scrollSnapAlign: 'start', scrollSnapStop: 'always' } as unknown as ViewStyle)
    : undefined;
const IS_WEB = Platform.OS === 'web';

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
  // 사용자가 실제로 뷰어를 조작(스와이프/버튼)하기 전까지 true 가 아님.
  // 그 전에는 어떤 이유로 스크롤이 리셋돼도 탭한 이슈 위치로 계속 되돌린다.
  const userTookOver = useRef(false);
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

  // 웹: 탭한 이슈 위치를 "핀 고정" — 사용자가 조작하기 전까지 계속 제자리로 되돌린다.
  // 1회성이 아니라 매 렌더 + 예기치 않은 스크롤 드리프트마다 재적용하므로, 리셋 원인이
  // 무엇이든(RNW initialScrollIndex 재스크롤 / useFeed 재검증 리렌더 / iOS Safari 앵커 리셋)
  // 탭한 이슈에서 벗어나지 않는다. getItemLayout 으로 콘텐츠 전체 높이가 잡혀 오프셋이 정확.
  const applyPin = useCallback(() => {
    if (!IS_WEB || !size || userTookOver.current) return;
    const target = Math.min(initialIndex, issues.length - 1);
    if (target <= 0) return;
    const offset = target * size.height;
    const node = listRef.current?.getScrollableNode?.() as { scrollTop?: number } | null;
    if (node && typeof node.scrollTop === 'number') {
      if (Math.abs(node.scrollTop - offset) > 1) node.scrollTop = offset;
    } else {
      listRef.current?.scrollToOffset({ offset, animated: false });
    }
  }, [size, initialIndex, issues.length]);

  // 매 렌더 후(페인트 전) 재적용 — 리렌더로 스크롤이 초기화돼도 즉시 복구.
  useLayoutEffect(() => {
    applyPin();
  });

  // 안전장치: 조작 이벤트가 어떤 이유로 안 잡혀도 핀이 영구히 가두지 않도록 몇 초 뒤 자동 해제.
  // 방어 대상 리셋(initialScrollIndex 재스크롤·리렌더·Safari 앵커)은 모두 마운트 직후 수백 ms 내
  // 발생하므로 이 창(4초) 안에서 충분히 방어된다.
  useEffect(() => {
    if (!IS_WEB) return;
    const t = setTimeout(() => {
      userTookOver.current = true;
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  // 사용자가 아직 조작하지 않았는데 스크롤이 핀 위치에서 벗어나면(비동기 리셋) 되돌린다.
  const onVScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      if (userTookOver.current || !IS_WEB || !size) return;
      const target = Math.min(initialIndex, issues.length - 1);
      if (target <= 0) return;
      if (Math.abs(e.nativeEvent.contentOffset.y - target * size.height) > 2) applyPin();
    },
    [applyPin, size, initialIndex, issues.length],
  );

  // 실제 사용자 조작(드래그/플링/버튼) 시작 → 핀 해제, 이후 자유 이동.
  const takeOver = useCallback(() => {
    userTookOver.current = true;
  }, []);

  // 웹: 스크롤 DOM 노드에 원시 입력 리스너를 붙여 사용자의 첫 조작을 확실히 감지 → 핀 해제.
  // (RNW onScrollBeginDrag 는 휠에선 안 뜨는 등 신뢰도가 낮아, touchstart/wheel/pointerdown 을
  //  직접 듣는다. 모바일 Safari 의 스와이프는 touchstart 가 이동 전에 먼저 발화한다.)
  useEffect(() => {
    if (!IS_WEB) return;
    const node = listRef.current?.getScrollableNode?.() as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;
    const release = () => {
      userTookOver.current = true;
    };
    const opts = { passive: true } as AddEventListenerOptions;
    const kinds = ['touchstart', 'wheel', 'pointerdown', 'keydown'];
    kinds.forEach((k) => node.addEventListener(k, release, opts));
    return () => kinds.forEach((k) => node.removeEventListener(k, release, opts));
  }, [size]);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    writeCache(cacheKeys.hintSeen, true);
  }, []);

  const scrollTo = useCallback(
    (index: number) => {
      const now = Date.now();
      if (now - lastNavAt.current < NAV_COOLDOWN_MS) return;
      lastNavAt.current = now;
      userTookOver.current = true; // 버튼 이동도 사용자 조작 → 핀 해제
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
          // 네이티브: RN JS 페이징 스냅. 웹: 위 CSS 스냅만 사용하고 JS 페이징 props 는 끈다
          // (둘이 겹치면 모바일 Safari 에서 한 스와이프가 중간에 멈추는 등 경합이 생김).
          pagingEnabled={!IS_WEB}
          decelerationRate="fast"
          snapToInterval={IS_WEB ? undefined : size.height}
          disableIntervalMomentum={!IS_WEB}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!verticalLocked}
          onScroll={onVScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={takeOver}
          onMomentumScrollBegin={takeOver}
          initialScrollIndex={Math.min(initialIndex, issues.length - 1)}
          getItemLayout={(_, index) => ({
            length: size.height,
            offset: size.height * index,
            index,
          })}
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
