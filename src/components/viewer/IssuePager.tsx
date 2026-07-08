import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cacheKeys, readCache, writeCache } from '@/data/cache';
import type { IssueCard } from '@/data/types';
import { spacing, useTheme } from '@/theme';

import { IssuePage } from './IssuePage';

interface Props {
  issues: IssueCard[];
  initialIndex: number;
  onClose: () => void;
  onPressRelated: (id: string) => void;
}

/**
 * 숏폼식 세로 페이저.
 * - 위/아래 스와이프 = 이전/다음 이슈 (한 화면 = 한 이슈)
 * - 더보기 페인이 열려 있는 동안은 세로 스크롤 잠금 (제스처 충돌 방지)
 */
export function IssuePager({ issues, initialIndex, onClose, onPressRelated }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
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

  const dismissHint = useCallback(() => {
    setShowHint(false);
    writeCache(cacheKeys.hintSeen, true);
  }, []);

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
          data={issues}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={{ paddingTop: insets.top, height: size.height }}>
              <IssuePage
                card={item}
                isActive={Math.abs(index - activeIndex) <= 1}
                width={size.width}
                height={size.height - insets.top}
                onDetailOpenChange={setVerticalLocked}
                onPressRelated={onPressRelated}
              />
            </View>
          )}
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
          windowSize={3}
          maxToRenderPerBatch={2}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}

      {/* 닫기 — 항상 우상단 */}
      <Pressable
        onPress={onClose}
        hitSlop={10}
        style={[styles.closeButton, { top: insets.top + spacing.sm, backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name="close" size={20} color={theme.text} />
      </Pressable>

      {/* 첫 진입 1회 제스처 힌트 */}
      {showHint && (
        <Pressable style={[styles.hintOverlay, { backgroundColor: theme.overlay }]} onPress={dismissHint}>
          <View style={[styles.hintCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.hintLine, { color: theme.text }]}>↕ 위아래로 넘기면 다음 이슈</Text>
            <Text style={[styles.hintLine, { color: theme.text }]}>→ 옆으로 넘기면 자세한 내용</Text>
            <Text style={[styles.hintDismiss, { color: theme.textMuted }]}>탭해서 시작하기</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 20,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    alignItems: 'center',
  },
  hintLine: { fontSize: 17, fontWeight: '700' },
  hintDismiss: { fontSize: 13, marginTop: spacing.sm },
});
