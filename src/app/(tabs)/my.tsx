import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/common/Card';
import { CategoryChip } from '@/components/common/CategoryChip';
import { StreakCard } from '@/components/common/StreakCard';
import { Wordmark } from '@/components/common/Wordmark';
import { copy } from '@/constants/copy';
import { feedbackUrl } from '@/constants/links';
import { useFeed } from '@/data/useFeed';
import { usePrefs } from '@/lib/store';
import { allCategories, cardShadow, categoryLabel, font, radius, spacing, typography, useTheme } from '@/theme';

/** 마이 — 출석 스트릭 + 관심 분야 선택 + 읽은 이슈 + 단어장 */
export default function MyScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { feed } = useFeed('importance');
  const { read, interests, toggleInterest, words } = usePrefs();
  const readCount = Object.keys(read).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Wordmark text="my" />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 베타: 피드백을 최상단에 크게 강조 (테스터 동선 1순위) */}
        <Pressable
          onPress={() => Linking.openURL(feedbackUrl())}
          style={({ pressed }) => [pressed && { opacity: 0.9 }]}>
          <View style={[styles.feedbackHero, { backgroundColor: theme.accent }]}>
            <View style={styles.feedbackHeroText}>
              <Text style={styles.feedbackHeroTitle}>{copy.feedback}</Text>
              <Text style={styles.feedbackHeroHint}>{copy.feedbackHint}</Text>
            </View>
            <View style={styles.feedbackHeroIcon}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            </View>
          </View>
        </Pressable>

        <StreakCard />

        <Card style={styles.interestsCard}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{copy.myInterests}</Text>
          <Text style={[styles.cardHint, { color: theme.textMuted }]}>{copy.myInterestsHint}</Text>
          <View style={styles.chips}>
            {allCategories.map((c) => (
              <CategoryChip
                key={c}
                label={categoryLabel(c)}
                selected={interests.includes(c)}
                onPress={() => toggleInterest(c)}
              />
            ))}
          </View>
        </Card>

        <Pressable
          onPress={() => router.push('/my/read')}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
          <Card style={styles.readRow}>
            <Text style={[styles.readLabel, { color: theme.text }]}>
              {copy.myReadIssues(readCount)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </Card>
        </Pressable>

        <Pressable
          onPress={() => router.push('/my/words')}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
          <Card style={styles.readRow}>
            <Text style={[styles.readLabel, { color: theme.text }]}>
              {copy.myWords(words.length)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </Card>
        </Pressable>

        <Text style={[styles.attribution, { color: theme.textMuted }]}>
          {feed?.attribution ? `${feed.attribution}\n` : ''}
          {copy.disclaimer}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  body: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  interestsCard: { gap: spacing.sm },
  cardTitle: { fontSize: 17, ...font(800) },
  cardHint: { ...typography.caption },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  readRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readLabel: { fontSize: 16, ...font(600) },
  feedbackHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...cardShadow,
  },
  feedbackHeroText: { flex: 1, gap: 3 },
  feedbackHeroTitle: { fontSize: 19, ...font(800), color: '#fff', letterSpacing: -0.2 },
  feedbackHeroHint: { fontSize: 13, ...font(500), color: 'rgba(255,255,255,0.9)' },
  feedbackHeroIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  attribution: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: spacing.lg },
});
