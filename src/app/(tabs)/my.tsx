import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/common/Card';
import { CategoryChip } from '@/components/common/CategoryChip';
import { Wordmark } from '@/components/common/Wordmark';
import { copy } from '@/constants/copy';
import { useFeed } from '@/data/useFeed';
import { usePrefs } from '@/lib/store';
import { allCategories, categoryColor, categoryLabel, font, spacing, typography, useTheme } from '@/theme';

/** 마이 — 관심 분야 선택 + 읽은 이슈 (그 외 설정 없음) */
export default function MyScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { feed } = useFeed('importance');
  const { read, interests, toggleInterest } = usePrefs();
  const readCount = Object.keys(read).length;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Wordmark text="my" />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Card style={styles.interestsCard}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{copy.myInterests}</Text>
          <Text style={[styles.cardHint, { color: theme.textMuted }]}>{copy.myInterestsHint}</Text>
          <View style={styles.chips}>
            {allCategories.map((c) => (
              <CategoryChip
                key={c}
                label={categoryLabel(c)}
                color={categoryColor(c)}
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
  attribution: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: spacing.lg },
});
