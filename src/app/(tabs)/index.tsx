import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChip } from '@/components/common/CategoryChip';
import { ErrorView, SkeletonCards } from '@/components/common/StateViews';
import { Wordmark } from '@/components/common/Wordmark';
import { FreshnessBar } from '@/components/feed/FreshnessBar';
import { IssueCard } from '@/components/feed/IssueCard';
import { SortToggle } from '@/components/feed/SortToggle';
import { copy } from '@/constants/copy';
import type { Category, SortKey } from '@/data/types';
import { useFeed } from '@/data/useFeed';
import { usePrefs } from '@/lib/store';
import { allCategories, categoryColor, categoryLabel, spacing, useTheme } from '@/theme';

export default function IssueListScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isRead, interests } = usePrefs();
  const [sort, setSort] = useState<SortKey>('importance');
  const [filter, setFilter] = useState<Category | null>(null);
  const { feed, issues, loading, refreshing, error, fromStaleCache, refresh } = useFeed(sort);

  // 칩 = 전체 + 데이터에 존재하는 카테고리, 관심 분야가 앞으로
  const categories = useMemo(() => {
    const present = new Set(issues.map((i) => i.category));
    const ordered = [
      ...interests.filter((c) => present.has(c)),
      ...allCategories.filter((c) => present.has(c) && !interests.includes(c)),
    ];
    return ordered;
  }, [issues, interests]);

  const visibleIssues = useMemo(
    () => (filter ? issues.filter((i) => i.category === filter) : issues),
    [issues, filter],
  );

  // 카드 memo 유지를 위한 안정 콜백 — 읽음 갱신 시 전체 리스트 리렌더 방지
  const openIssue = useCallback(
    (id: string) => router.push({ pathname: '/issue/[id]', params: { id, sort } }),
    [router, sort],
  );

  const showError = error !== null && issues.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Wordmark text="onion" />
          <FreshnessBar generatedAt={feed?.generated_at ?? null} offline={fromStaleCache || error !== null} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          <CategoryChip label="전체" selected={filter === null} onPress={() => setFilter(null)} />
          {categories.map((c) => (
            <CategoryChip
              key={c}
              label={categoryLabel(c)}
              color={categoryColor(c)}
              selected={filter === c}
              onPress={() => setFilter(filter === c ? null : c)}
            />
          ))}
        </ScrollView>

        <View style={styles.sortRow}>
          <SortToggle sort={sort} onChange={setSort} />
        </View>
      </View>

      {loading ? (
        <SkeletonCards />
      ) : showError ? (
        <ErrorView onRetry={refresh} />
      ) : (
        <FlatList
          data={visibleIssues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IssueCard issue={item} read={isRead(item.id)} onPressIssue={openIssue} />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.textMuted} />
          }
          ListFooterComponent={
            feed ? (
              <Text style={[styles.attribution, { color: theme.textMuted }]}>
                {feed.attribution}
                {'\n'}
                {copy.disclaimer}
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: spacing.sm, gap: spacing.sm },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  chips: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md },
  sortRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.md },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  attribution: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: spacing.lg },
});
