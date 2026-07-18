import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { GlossaryText } from '@/components/glossary/GlossaryText';
import { copy } from '@/constants/copy';
import type { EffectRow, GlossaryEntry } from '@/data/types';
import { font, radius, spacing, tint, typography, useTheme } from '@/theme';

function SectionTitle({ children }: { children: string }) {
  const { theme } = useTheme();
  return <Text style={[styles.sectionTitle, { color: theme.text }]}>{children}</Text>;
}

/** 무슨 일이에요? — 1~3줄 불릿을 흰 카드에 담아 본문임을 분명히 (목업 톤) */
export function DetailsSection({ details, glossary }: { details: string[]; glossary: GlossaryEntry[] }) {
  const { theme } = useTheme();
  if (details.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>{copy.sectionDetails}</SectionTitle>
      <Card style={styles.detailsCard}>
        {details.map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={[styles.bulletDot, { backgroundColor: theme.accent }]} />
            <GlossaryText
              text={line}
              glossary={glossary}
              style={[typography.body, { color: theme.text, flex: 1 }]}
            />
          </View>
        ))}
      </Card>
    </View>
  );
}

/**
 * 그래서 어떻게 되나요? — 정보별 행: 방향 칩(기름값 ↑) + 본문 + 근거 한 줄 (목업 형태).
 * effect_rows 가 없는 구 데이터는 기존 문자열 effects 로 폴백.
 */
export function EffectRowsSection({
  rows,
  effects,
  glossary,
}: {
  rows: EffectRow[];
  effects: string[];
  glossary: GlossaryEntry[];
}) {
  const { theme } = useTheme();
  if (rows.length === 0 && effects.length === 0) return null;

  const chipColor = (d: EffectRow['direction']) =>
    d === 'up' ? theme.up : d === 'down' ? theme.down : theme.accent;

  return (
    <View style={styles.section}>
      <SectionTitle>{copy.sectionEffects}</SectionTitle>
      <View style={[styles.effectsBox, { backgroundColor: theme.accentSoft }]}>
        {rows.length > 0
          ? rows.map((r, i) => (
              <View key={i} style={[styles.effectRow, { backgroundColor: theme.surface }]}>
                <View style={[styles.effectChip, { backgroundColor: tint(chipColor(r.direction), 0.12) }]}>
                  <Text style={[styles.effectChipLabel, { color: chipColor(r.direction) }]}>
                    {r.label}
                  </Text>
                </View>
                <View style={styles.effectBody}>
                  <GlossaryText
                    text={r.text}
                    glossary={glossary}
                    style={[styles.effectText, { color: theme.text }]}
                  />
                  {!!r.basis && (
                    <Text style={[styles.effectBasis, { color: theme.textMuted }]}>{r.basis}</Text>
                  )}
                </View>
              </View>
            ))
          : effects.map((line, i) => (
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

/** 알아두면 좋아요 — 중립 꿀팁 리스트 */
export function TipsSection({ tips, glossary }: { tips: string[]; glossary: GlossaryEntry[] }) {
  const { theme } = useTheme();
  if (tips.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionTitle>{copy.sectionTips}</SectionTitle>
      <Card style={styles.detailsCard}>
        {tips.map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.tipEmoji}>💡</Text>
            <GlossaryText
              text={line}
              glossary={glossary}
              style={[styles.tipText, { color: theme.textSecondary, flex: 1 }]}
            />
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 17, ...font(800), marginBottom: 2 },
  detailsCard: { gap: spacing.sm },
  bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  bulletDot: { width: 5, height: 5, borderRadius: 3, marginTop: 9, opacity: 0.6 },
  effectsBox: {
    borderRadius: radius.card,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  effectRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
    borderRadius: radius.control,
    padding: spacing.sm + 2,
  },
  effectChip: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginTop: 1,
  },
  effectChipLabel: { fontSize: 12.5, ...font(800) },
  effectBody: { flex: 1, gap: 3 },
  effectText: { fontSize: 14, lineHeight: 21, ...font(500) },
  effectBasis: { ...typography.micro },
  effectEmoji: { fontSize: 15, lineHeight: 23 },
  tipEmoji: { fontSize: 13, lineHeight: 21 },
  tipText: { fontSize: 14, lineHeight: 21 },
});
