import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { DeltaPill } from '@/components/common/DeltaPill';
import { GlossaryText } from '@/components/glossary/GlossaryText';
import { copy } from '@/constants/copy';
import type {
  Anchor,
  GlossaryEntry,
  Headline,
  RelatedIssue,
  TimelineEntry,
} from '@/data/types';
import { font, radius, spacing, typography, useTheme } from '@/theme';
import { formatNumber, koreanRatio, periodLabel, relativeTime } from '@/utils/format';

function SectionTitle({ children }: { children: string }) {
  const { theme } = useTheme();
  return <Text style={[styles.sectionTitle, { color: theme.text }]}>{children}</Text>;
}

/** 무슨 일이에요? — 쉬운 문장 불릿 */
export function DetailsSection({ details, glossary }: { details: string[]; glossary: GlossaryEntry[] }) {
  const { theme } = useTheme();
  if (details.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>{copy.sectionDetails}</SectionTitle>
      {details.map((line, i) => (
        <View key={i} style={styles.bulletRow}>
          <Text style={[styles.bullet, { color: theme.textMuted }]}>·</Text>
          <GlossaryText text={line} glossary={glossary} style={[typography.body, { color: theme.text, flex: 1 }]} />
        </View>
      ))}
    </View>
  );
}

/** 그래서 어떻게 되나요? — 앱에서 유일한 보라 면 강조 */
export function EffectsSection({ effects, glossary }: { effects: string[]; glossary: GlossaryEntry[] }) {
  const { theme } = useTheme();
  if (effects.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>{copy.sectionEffects}</SectionTitle>
      <View style={[styles.effectsBox, { backgroundColor: theme.accentSoft }]}>
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

/** 숫자로 보면 — 공식 수치 행: 지표명/기간·출처 | 값 + 델타 필 */
export function AnchorsSection({ anchors }: { anchors: Anchor[] }) {
  const { theme } = useTheme();
  if (anchors.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>{copy.sectionAnchors}</SectionTitle>
      <Card style={styles.anchorCard}>
        {anchors.map((a, i) => {
          const delta = a.prev != null ? a.value - a.prev : null;
          const direction = delta == null || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';
          return (
            <View key={i} style={[styles.anchorRow, i > 0 && { borderTopColor: theme.hairline, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <View style={styles.anchorInfo}>
                <Text style={[styles.anchorMetric, { color: theme.text }]} numberOfLines={1}>
                  {a.entity} {a.metric}
                </Text>
                <Text style={[styles.anchorMeta, { color: theme.textMuted }]} numberOfLines={1}>
                  {periodLabel(a.period)} · {a.source}
                </Text>
              </View>
              <View style={styles.anchorValueCol}>
                <Text style={[styles.anchorValue, { color: theme.text }]}>
                  {formatNumber(a.value)}
                  {a.unit}
                </Text>
                {delta != null && delta !== 0 && (
                  <DeltaPill text={`${formatNumber(Math.abs(delta))}${a.unit}`} direction={direction} />
                )}
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

async function openUrl(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    // 백엔드에 backfill.example 같은 더미 URL 이 실존한다
    Alert.alert(copy.invalidLinkTitle, copy.invalidLinkBody);
  }
}

/** 지금까지 흐름 — 공식 발표(🏛)와 언론 보도(📰) */
export function TimelineSection({ timeline }: { timeline: TimelineEntry[] }) {
  const { theme } = useTheme();
  if (timeline.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>{copy.sectionTimeline}</SectionTitle>
      <Card style={styles.timelineBox}>
        {timeline.map((entry, i) => (
          <Pressable
            key={i}
            onPress={() => openUrl(entry.url)}
            style={({ pressed }) => [styles.timelineRow, pressed && { opacity: 0.7 }]}>
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
      </Card>
    </View>
  );
}

/** 원문이 외국어인지 — 백엔드 lang 필드 우선, 구 JSON 은 한글 비율로 추정 */
function isForeignHeadline(h: Headline): boolean {
  if (h.lang) return h.lang !== 'ko';
  return koreanRatio(h.title) < 0.3;
}

/** 실제 기사로 보기 — 원문 링크 행. 외국어 원문에는 언어 배지로 기대치를 조정한다. */
export function HeadlinesSection({ headlines }: { headlines: Headline[] }) {
  const { theme } = useTheme();
  if (headlines.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>{copy.sectionHeadlines}</SectionTitle>
      {headlines.map((h, i) => (
        <Pressable
          key={i}
          onPress={() => openUrl(h.url)}
          style={({ pressed }) => [
            styles.headlineRow,
            { backgroundColor: theme.surface, borderColor: theme.border },
            pressed && { opacity: 0.7 },
          ]}>
          <View style={styles.timelineBody}>
            <Text style={[styles.timelineTitle, { color: theme.text }]} numberOfLines={2}>
              {h.title}
            </Text>
            <View style={styles.headlineMetaRow}>
              {isForeignHeadline(h) && (
                <Text style={[styles.langBadge, { color: theme.textMuted, borderColor: theme.border }]}>
                  {(h.lang ?? 'en').toUpperCase()}
                </Text>
              )}
              <Text style={[styles.timelineMeta, { color: theme.textMuted }]}>{h.source}</Text>
            </View>
          </View>
          <Ionicons name="open-outline" size={16} color={theme.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

/** 같이 보면 좋아요 — 관련 이슈 (탭하면 뷰어 전환) */
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
      <SectionTitle>{copy.sectionRelated}</SectionTitle>
      <View style={styles.relatedWrap}>
        {related.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => onPressIssue(r.id)}
            style={({ pressed }) => [
              styles.relatedChip,
              { backgroundColor: theme.surface, borderColor: theme.border },
              pressed && { opacity: 0.7 },
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
  sectionTitle: { fontSize: 17, ...font(800), marginBottom: 2 },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bullet: { ...typography.body },
  effectsBox: {
    borderRadius: radius.card,
    padding: spacing.md,
    gap: spacing.sm,
  },
  effectEmoji: { fontSize: 15, lineHeight: 23 },
  anchorCard: { paddingVertical: spacing.xs, gap: 0 },
  anchorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
  },
  anchorInfo: { flex: 1, gap: 2 },
  anchorMetric: { fontSize: 14, ...font(600) },
  anchorMeta: { ...typography.micro },
  anchorValueCol: { alignItems: 'flex-end', gap: spacing.xs },
  anchorValue: { fontSize: 18, ...font(800), fontVariant: ['tabular-nums'] },
  timelineBox: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  timelineRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 10 },
  timelineIcon: { fontSize: 15 },
  timelineBody: { flex: 1, gap: 2 },
  timelineTitle: { fontSize: 14, lineHeight: 20, ...font(500) },
  timelineMeta: { ...typography.caption },
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  headlineMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  langBadge: {
    fontSize: 9,
    ...font(700),
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  relatedWrap: { gap: spacing.sm },
  relatedChip: {
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: 6,
  },
  relatedTitle: { fontSize: 14, ...font(600) },
});
