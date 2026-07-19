import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyStatTiles } from '@/components/common/KeyStatTiles';
import { MiniChart } from '@/components/common/MiniChart';
import { EmptyView } from '@/components/common/StateViews';
import { Wordmark } from '@/components/common/Wordmark';
import { copy } from '@/constants/copy';
import type { SteadyItem } from '@/data/types';
import { useFeed } from '@/data/useFeed';
import { cardShadow, font, radius, spacing, tint, typography, useTheme } from '@/theme';

/**
 * 스테디 — 계속 지켜봐야 할 장기 이슈 ('시리즈물').
 * 카드 = 제목(아이콘) + 한 줄 정의 + 지금 스코어 미니 타일 + 미니 차트 (v4).
 */
export default function SteadyScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { feed } = useFeed('importance');
  const steady = feed?.steady ?? [];

  const chartWidth = width - spacing.md * 2 - spacing.md * 2; // 페이지·카드 패딩 제외

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Wordmark text="steady" />
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>{copy.steadySubtitle}</Text>
      </View>

      {steady.length === 0 ? (
        <EmptyView emoji="🌱" title={copy.steadyEmptyTitle} subtitle={copy.steadyEmptySubtitle} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {steady.map((item: SteadyItem) => (
            <Pressable
              key={item.id}
              onPress={() => router.push({ pathname: '/steady/[id]', params: { id: item.id } })}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.surface },
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
                {item.icon ? `${item.icon} ` : ''}
                {item.title}
              </Text>
              {!!(item.definition ?? item.one_liner) && (
                <Text style={[styles.definition, { color: theme.textSecondary }]} numberOfLines={3}>
                  {item.definition ?? item.one_liner}
                </Text>
              )}
              {!!item.score?.length && <KeyStatTiles stats={item.score} size="sm" />}
              {item.visual ? (
                <MiniChart visual={item.visual} width={chartWidth} height={110} />
              ) : (
                <View style={[styles.placeholder, { backgroundColor: tint(theme.accent, 0.05) }]}>
                  <Text style={styles.placeholderIcon}>{item.icon ?? '🌱'}</Text>
                </View>
              )}
            </Pressable>
          ))}
          <Text style={[styles.disclaimer, { color: theme.textMuted }]}>{copy.disclaimer}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.xs },
  subtitle: { ...typography.caption },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  card: {
    minHeight: 232, // 일반 카드 높이의 약 2배
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.md,
    ...cardShadow,
  },
  cardTitle: { fontSize: 19, ...font(800), lineHeight: 26 },
  definition: { fontSize: 14, lineHeight: 21 },
  placeholder: {
    flex: 1,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: { fontSize: 56 },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: spacing.sm },
});
