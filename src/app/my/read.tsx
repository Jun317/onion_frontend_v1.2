import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryBadge } from '@/components/common/CategoryBadge';
import { EmptyView } from '@/components/common/StateViews';
import { copy } from '@/constants/copy';
import { useFeed } from '@/data/useFeed';
import { usePrefs } from '@/lib/store';
import { font, radius, spacing, typography, useTheme } from '@/theme';
import { relativeTime } from '@/utils/format';

/**
 * 읽은 이슈 목록 — 행 탭 = 이슈 뷰어, ✕ = 읽음 기록 삭제 (피드 카드 딜링도 원복).
 * 현재 피드에 없는(아카이브된) 이슈는 제목을 알 수 없어 표시하지 않는다.
 */
export default function ReadListScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { feed } = useFeed('importance');
  const { read, unmarkRead } = usePrefs();

  const rows = useMemo(() => {
    const issues = feed?.issues ?? [];
    return issues.filter((i) => i.id in read).sort((a, b) => (read[b.id] ?? 0) - (read[a.id] ?? 0));
  }, [feed, read]);

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/my');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={10} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {copy.myReadIssues(rows.length)}
        </Text>
      </View>

      {rows.length === 0 ? (
        <EmptyView emoji="📖" title={copy.myReadEmpty} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/issue/[id]', params: { id: item.id, sort: 'importance' } })
              }
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && { opacity: 0.7 },
              ]}>
              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <CategoryBadge category={item.category} />
                  <Text style={[styles.rowTime, { color: theme.textMuted }]}>
                    {relativeTime(item.last_update)}
                  </Text>
                </View>
                <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
              <Pressable
                onPress={() => unmarkRead(item.id)}
                hitSlop={8}
                style={[styles.deleteButton, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="close" size={14} color={theme.textMuted} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  rowBody: { flex: 1, gap: spacing.xs },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTime: { ...typography.caption },
  rowTitle: { fontSize: 15, ...font(600), lineHeight: 21 },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
