import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { GlossaryText } from '@/components/glossary/GlossaryText';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import type {
  Anchor,
  GlossaryEntry,
  Headline,
  RelatedIssue,
  TimelineEntry,
} from '@/data/types';
import { spacing, typography, useTheme } from '@/theme';
import { formatNumber, periodLabel, relativeTime } from '@/utils/format';

function SectionTitle({ children }: { children: string }) {
  const { theme } = useTheme();
  return <Text style={[styles.sectionTitle, { color: theme.text }]}>{children}</Text>;
}

/** 자세한 내용 — 쉬운 문장 불릿 */
export function DetailsSection({ details, glossary }: { details: string[]; glossary: GlossaryEntry[] }) {
  const { theme } = useTheme();
  if (details.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>무슨 일이에요?</SectionTitle>
      {details.map((line, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: theme.textMuted }]}>•</Text>
          <GlossaryText text={line} glossary={glossary} style={[typography.body, { color: theme.text, flex: 1 }]} />
        </View>
      ))}
    </View>
  );
}

/** 나에게 미치는 영향 */
export function EffectsSection({ effects, glossary }: { effects: string[]; glossary: GlossaryEntry[] }) {
  const { theme } = useTheme();
  if (effects.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>그래서 어떻게 되나요?</SectionTitle>
      <View style={[styles.effectsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {effects.map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.effectEmoji}>👉</Text>
            <GlossaryText
              text={line}
              glossary={glossary}
              style={[typography.body, { color: theme.text, flex: 1 }]}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

/** 공식 수치 카드 — 값 + 이전값 대비 증감 */
export function AnchorsSection({ anchors }: { anchors: Anchor[] }) {
  const { theme } = useTheme();
  if (anchors.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>숫자로 보면</SectionTitle>
      <View style={styles.anchorGrid}>
        {anchors.map((a, i) => {
          const delta = a.prev != null ? a.value - a.prev : null;
          const deltaColor = delta == null ? theme.textMuted : delta > 0 ? theme.up : delta < 0 ? theme.down : theme.textMuted;
          return (
            <View key={i} style={[styles.anchorCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.anchorMetric, { color: theme.textSecondary }]} numberOfLines={1}>
                {a.entity} {a.metric}
              </Text>
              <Text style={[styles.anchorValue, { color: theme.text }]}>
                {formatNumber(a.value)}
                {a.unit}
              </Text>
              {delta != null && (
                <Text style={[styles.anchorDelta, { color: deltaColor }]}>
                  {delta > 0 ? '▲' : delta < 0 ? '▼' : '—'} {formatNumber(Math.abs(delta))}
                  {a.unit} (이전 {formatNumber(a.prev!)}
                  {a.unit})
                </Text>
              )}
              <Text style={[styles.anchorPeriod, { color: theme.textMuted }]}>
                {periodLabel(a.period)} · {a.source}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    // 백엔드에 backfill.example 같은 더미 URL 이 실존한다
    Alert.alert('열 수 없는 링크예요', '원문 주소가 유효하지 않아요.');
  }
}

/** 흐름 타임라인 — 공식 발표(🏛)와 언론 보도(📰) */
export function TimelineSection({ timeline }: { timeline: TimelineEntry[] }) {
  const { theme } = useTheme();
  if (timeline.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>지금까지 흐름</SectionTitle>
      <View style={[styles.timelineBox, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        {timeline.map((entry, i) => (
          <Pressable
            key={i}
            onPress={() => openUrl(entry.url)}
            style={({ pressed }) => [styles.timelineRow, pressed && { opacity: 0.6 }]}>
            <Text style={styles.timelineIcon}>{entry.kind === 'official' ? '🏛' : '📰'}</Text>
            <View style={styles.timelineBody}>
              <Text style={[styles.timelineTitle, { color: theme.text }]} numberOfLines={2}>
                {entry.title}
              </Text>
              <Text style={[styles.timelineMeta, { color: theme.textMuted }]}>
                {entry.source} · {relativeTime(entry.at)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** 관련 기사 원문 링크 */
export function HeadlinesSection({ headlines }: { headlines: Headline[] }) {
  const { theme } = useTheme();
  if (headlines.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>원문 기사</SectionTitle>
      {headlines.map((h, i) => (
        <Pressable
          key={i}
          onPress={() => openUrl(h.url)}
          style={({ pressed }) => [
            styles.headlineRow,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && { opacity: 0.6 },
          ]}>
          <View style={styles.timelineBody}>
            <Text style={[styles.timelineTitle, { color: theme.text }]} numberOfLines={2}>
              {h.title}
            </Text>
            <Text style={[styles.timelineMeta, { color: theme.textMuted }]}>{h.source}</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={theme.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

/** 관련 이슈 칩 */
export function RelatedSection({
  related,
  onPressIssue,
}: {
  related: RelatedIssue[];
  onPressIssue: (id: string) => void;
}) {
  const { theme } = useTheme();
  if (related.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>같이 보면 좋아요</SectionTitle>
      <View style={styles.relatedWrap}>
        {related.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => onPressIssue(r.id)}
            style={({ pressed }) => [
              styles.relatedChip,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { opacity: 0.6 },
            ]}>
            <CategoryBadge category={r.category} />
            <Text style={[styles.relatedTitle, { color: theme.text }]} numberOfLines={1}>
              {r.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bullet: { ...typography.body },
  effectsBox: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
  },
  effectEmoji: { fontSize: 16, lineHeight: 27 },
  anchorGrid: { gap: spacing.sm },
  anchorCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: 2,
  },
  anchorMetric: { fontSize: 13, fontWeight: '600' },
  anchorValue: { fontSize: 26, fontWeight: '800' },
  anchorDelta: { fontSize: 13, fontWeight: '600' },
  anchorPeriod: { ...typography.caption },
  timelineBox: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingVertical: 4 },
  timelineRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  timelineIcon: { fontSize: 15 },
  timelineBody: { flex: 1, gap: 2 },
  timelineTitle: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  timelineMeta: { ...typography.caption },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  relatedWrap: { gap: spacing.sm },
  relatedChip: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: 6,
  },
  relatedTitle: { fontSize: 14, fontWeight: '600' },
});
