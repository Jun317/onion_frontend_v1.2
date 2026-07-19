import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChartCard } from '@/components/charts/ChartCard';
import { TableCard } from '@/components/charts/TableCard';
import { TimelineCard } from '@/components/charts/TimelineCard';
import { Card } from '@/components/common/Card';
import { KeyStatTiles } from '@/components/common/KeyStatTiles';
import { MiniChart } from '@/components/common/MiniChart';
import { ErrorView } from '@/components/common/StateViews';
import { LinkedText } from '@/components/steady/LinkedText';
import { copy } from '@/constants/copy';
import type { SteadyTimelineEntry, Visual } from '@/data/types';
import { normalizeVisual } from '@/data/normalize';
import { useFeed } from '@/data/useFeed';
import { cardShadow, font, radius, spacing, tint, typography, useTheme } from '@/theme';

function BlockTitle({ children }: { children: string }) {
  const { theme } = useTheme();
  return <Text style={[styles.blockTitle, { color: theme.textMuted }]}>{children}</Text>;
}

/** kind 별 시각자료 라우팅 */
function VisualBlock({ visual, width }: { visual: Visual; width: number }) {
  const kind = visual.kind ?? 'chart';
  if (kind === 'table') return <TableCard visual={visual} width={width} />;
  if (kind === 'timeline') return <TimelineCard visual={visual} width={width} />;
  return <ChartCard visual={visual} width={width} />;
}

/**
 * 스테디 전용 페이지 v4 — '시리즈물' 6블록 세로 스크롤:
 * 태그라인·정의 히어로 → 지금 스코어 → 줄거리 → 타임라인(이슈 링크) →
 * 나에게 미치는 영향 → 다음 화 예고 → 연결 시각자료.
 * 구(2페이지 가로 페이저) 데이터는 개요+detail 문단 폴백으로 렌더.
 */
export default function SteadyViewerScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { feed } = useFeed('importance');
  const [width, setWidth] = useState(0);

  const item = feed?.steady?.find((s) => s.id === params.id);
  const issueTitles = new Map((feed?.issues ?? []).map((i) => [i.id, i.title]));

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/steady');
  };
  const openIssue = (id: string) =>
    router.push({ pathname: '/issue/[id]', params: { id, sort: 'importance' } });

  const background = tint(theme.accent, 0.06);

  if (!item) {
    return (
      <View style={[styles.fill, { backgroundColor: background }]}>
        <ErrorView onRetry={close} />
      </View>
    );
  }

  const timeline: SteadyTimelineEntry[] = item.timeline ?? [];
  const visuals = (item.visuals ?? [])
    .map(normalizeVisual)
    .filter((v): v is Visual => v !== null);
  const contentWidth = width - spacing.md * 2;

  return (
    <View
      style={[styles.fill, { backgroundColor: background }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <ScrollView
          contentContainerStyle={[styles.page, { paddingTop: insets.top + 56 }]}
          showsVerticalScrollIndicator={false}>
          {/* 히어로: 태그라인 + 제목 + 한 줄 정의 */}
          {!!item.status_note && (
            <Text style={[styles.statusNote, { color: theme.accent }]}>{item.status_note}</Text>
          )}
          <Text style={[styles.title, { color: theme.text }]}>
            {item.icon ? `${item.icon} ` : ''}
            {item.title}
          </Text>
          <Text style={[styles.oneLiner, { color: theme.textSecondary }]}>
            {item.definition ?? item.one_liner}
          </Text>

          {/* ② 지금 스코어 */}
          {!!item.score?.length && (
            <View style={styles.block}>
              <BlockTitle>{copy.steadyScore}</BlockTitle>
              <KeyStatTiles stats={item.score} size="sm" />
            </View>
          )}

          {/* ③ 지금까지 줄거리 */}
          {!!item.story?.length && (
            <View style={styles.block}>
              <BlockTitle>{copy.steadyStory}</BlockTitle>
              <Card style={styles.storyCard}>
                {item.story.map((line, i) => (
                  <View key={i} style={styles.storyRow}>
                    <Text style={[styles.storyIndex, { color: theme.accent }]}>{i + 1}</Text>
                    <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{line}</Text>
                  </View>
                ))}
              </Card>
            </View>
          )}

          {/* ④ 타임라인 — 이슈 카드 링크 (최신이 위, hot 강조) */}
          {timeline.length > 0 && (
            <View style={styles.block}>
              <BlockTitle>{copy.steadyTimeline}</BlockTitle>
              <Card style={styles.timelineCard}>
                {timeline.map((entry, i) => (
                  <View
                    key={i}
                    style={[
                      styles.timelineRow,
                      entry.hot && {
                        backgroundColor: tint(theme.up, 0.08),
                        borderRadius: radius.control,
                      },
                    ]}>
                    <View
                      style={[styles.timelineDot, { backgroundColor: entry.hot ? theme.up : theme.accent }]}
                    />
                    <View style={styles.timelineBody}>
                      <Text style={[styles.timelineDate, { color: entry.hot ? theme.up : theme.accent }]}>
                        {entry.date_label}
                      </Text>
                      <Text style={[styles.timelineText, { color: theme.text }]}>{entry.text}</Text>
                      {!!entry.links?.length && (
                        <View style={styles.linkRow}>
                          {entry.links.map((link) => (
                            <Pressable
                              key={link.issue_id}
                              onPress={() => openIssue(link.issue_id)}
                              style={({ pressed }) => [
                                styles.linkChip,
                                { backgroundColor: theme.surface, borderColor: theme.border },
                                pressed && { opacity: 0.7 },
                              ]}>
                              <Text
                                style={[styles.linkChipText, { color: theme.accent }]}
                                numberOfLines={1}>
                                {link.label ?? issueTitles.get(link.issue_id) ?? '이슈 보기'}
                              </Text>
                              <Ionicons name="chevron-forward" size={11} color={theme.accent} />
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          )}

          {/* ⑤ 나에게 미치는 영향 */}
          {!!item.impact?.length && (
            <View style={styles.block}>
              <BlockTitle>{copy.steadyImpact}</BlockTitle>
              <Card style={[styles.impactCard, { backgroundColor: tint(theme.accent, 0.08) }]}>
                {item.impact.map((line, i) => (
                  <Text key={i} style={[styles.impactText, { color: theme.text }]}>
                    {line}
                  </Text>
                ))}
              </Card>
            </View>
          )}

          {/* ⑥ 다음 화 예고 */}
          {!!item.next_up?.length && (
            <View style={styles.block}>
              <BlockTitle>{copy.steadyNextUp}</BlockTitle>
              <Card style={styles.storyCard}>
                {item.next_up.map((line, i) => (
                  <View key={i} style={styles.storyRow}>
                    <Text style={[styles.checkbox, { color: theme.textMuted }]}>☐</Text>
                    <Text style={[styles.nextUpText, { color: theme.textSecondary, flex: 1 }]}>
                      {line}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>
          )}

          {/* 연결 시각자료 (원본형) */}
          {visuals.length > 0 && (
            <View style={styles.block}>
              <BlockTitle>{copy.steadyVisuals}</BlockTitle>
              <View style={styles.visualList}>
                {visuals.map((v, i) => (
                  <VisualBlock key={v.id ?? i} visual={v} width={contentWidth} />
                ))}
              </View>
            </View>
          )}

          {/* 구 데이터 폴백 — 6블록 없이 detail 문단만 있을 때 */}
          {timeline.length === 0 &&
            !item.story?.length &&
            item.detail.map((para, i) => (
              <Card key={i}>
                <LinkedText
                  text={para.text}
                  refs={para.refs}
                  onPressRef={openIssue}
                  style={[typography.body, { color: theme.text }]}
                />
              </Card>
            ))}
          {timeline.length === 0 && !item.story?.length && item.visual && (
            <Card>
              <MiniChart visual={item.visual} width={width - spacing.md * 4} />
            </Card>
          )}

          <Text style={[styles.disclaimer, { color: theme.textMuted }]}>{copy.disclaimer}</Text>
        </ScrollView>
      )}

      {/* 상단 오버레이 — 닫기 */}
      <View style={[styles.topOverlay, { top: insets.top + spacing.sm }]}>
        <Pressable
          onPress={close}
          hitSlop={10}
          style={[styles.closeButton, { backgroundColor: theme.surface }]}>
          <Ionicons name="close" size={18} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { paddingHorizontal: spacing.md, paddingBottom: 64, gap: spacing.sm },
  statusNote: { fontSize: 12, letterSpacing: 0.4, ...font(700) },
  title: { ...typography.viewerTitle },
  oneLiner: { fontSize: 16, lineHeight: 25, ...font(400), marginBottom: spacing.xs },
  block: { gap: spacing.xs, marginTop: spacing.sm },
  blockTitle: { ...typography.caption, ...font(800), letterSpacing: 0.3 },
  storyCard: { gap: spacing.sm },
  storyRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  storyIndex: { fontSize: 13, ...font(800), lineHeight: 23, width: 14 },
  checkbox: { fontSize: 14, lineHeight: 21 },
  nextUpText: { fontSize: 14, lineHeight: 21 },
  timelineCard: { gap: spacing.xs, paddingVertical: spacing.sm },
  timelineRow: { flexDirection: 'row', gap: spacing.sm, padding: 6 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  timelineBody: { flex: 1, gap: 2 },
  timelineDate: { ...typography.micro, ...font(700) },
  timelineText: { fontSize: 13.5, lineHeight: 20, ...font(500) },
  linkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  linkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 220,
  },
  linkChipText: { fontSize: 12, ...font(600) },
  impactCard: { gap: spacing.sm },
  impactText: { fontSize: 14, lineHeight: 22 },
  visualList: { gap: spacing.sm },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: spacing.md },
  topOverlay: { position: 'absolute', right: spacing.md, alignItems: 'flex-end' },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
});
