import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorView, SkeletonCards } from '@/components/common/StateViews';
import { FreshnessBar } from '@/components/feed/FreshnessBar';
import { IssueCard } from '@/components/feed/IssueCard';
import { SortToggle } from '@/components/feed/SortToggle';
import type { SortKey } from '@/data/types';
import { useFeed } from '@/data/useFeed';
import { spacing, useTheme } from '@/theme';

export default function IssueListScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sort, setSort] = useState<SortKey>('importance');
  const { feed, issues, loading, refreshing, error, fromStaleCache, refresh } = useFeed(sort);

  const showError = error !== null && issues.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.logo, { color: theme.text }]}>어니언</Text>
          <FreshnessBar generatedAt={feed?.generated_at ?? null} offline={fromStaleCache || error !== null} />
        </View>
        <SortToggle sort={sort} onChange={setSort} />
      </View>

      {loading ? (
        <SkeletonCards />
      ) : showError ? (
        <ErrorView onRetry={refresh} />
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <IssueCard
              issue={item}
              rank={index}
              onPress={() => router.push({ pathname: '/issue/[id]', params: { id: item.id, sort } })}
            />
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
                {'\n'}본 콘텐츠는 투자 판단의 근거가 아닙니다.
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
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  logo: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  attribution: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: spacing.lg },
});
