import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/common/Card';
import { MiniChart } from '@/components/common/MiniChart';
import { ErrorView } from '@/components/common/StateViews';
import { LinkedText } from '@/components/steady/LinkedText';
import { SteadyTable } from '@/components/steady/SteadyTable';
import { copy } from '@/constants/copy';
import { useFeed } from '@/data/useFeed';
import { font, radius, spacing, tint, typography, useTheme } from '@/theme';
import { relativeTime } from '@/utils/format';

/**
 * 스테디 전용 페이지 — 배경 accent 6% 틴트, 가로 2페이지 (① 개요 ↔ ② 상세 설명).
 * 상세 문단의 이슈 언급은 accent 밑줄 링크 — 탭하면 해당 이슈 뷰어가 위에 열린다.
 */
export default function SteadyViewerScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { feed } = useFeed('importance');
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const item = feed?.steady?.find((s) => s.id === params.id);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/steady');
  };
  const openIssue = (id: string) =>
    router.push({ pathname: '/issue/[id]', params: { id, sort: 'importance' } });

  const goTo = (p: number) => {
    if (!size) return;
    scrollRef.current?.scrollTo({ x: p * size.width, animated: true });
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!size) return;
    setPage(Math.round(e.nativeEvent.contentOffset.x / size.width));
  };

  const background = tint(theme.accent, 0.06);

  if (!item) {
    return (
      <View style={[styles.fill, { backgroundColor: background }]}>
        <ErrorView onRetry={close} />
      </View>
    );
  }

  return (
    <View
      style={[styles.fill, { backgroundColor: background }]}
      onLayout={(e) => setSize(e.nativeEvent.layout)}>
      {size && (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}>
          {/* ① 개요 — 핵심 한줄 · 가장 최근 소식 · 경제 영향 · 핵심 수치 표 */}
          <ScrollView
            style={{ width: size.width }}
            contentContainerStyle={[styles.page, { paddingTop: insets.top + 56 }]}
            showsVerticalScrollIndicator={false}>
            {!!item.status_note && (
              <Text style={[styles.statusNote, { color: theme.accent }]}>{item.status_note}</Text>
            )}
            <Text style={[styles.title, { color: theme.text }]}>
              {item.icon ? `${item.icon} ` : ''}
              {item.title}
            </Text>
            <Text style={[styles.oneLiner, { color: theme.textSecondary }]}>{item.one_liner}</Text>

            {/* 가장 최근 핵심 이슈 — 탭하면 해당 이슈 뷰어로 */}
            {item.latest_issue && (
              <Pressable
                onPress={() => openIssue(item.latest_issue!.id)}
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
                <Card style={styles.latestCard}>
                  {!!item.latest_issue.icon && (
                    <Text style={styles.latestIcon}>{item.latest_issue.icon}</Text>
                  )}
                  <View style={styles.latestBody}>
                    <Text style={[styles.latestLabel, { color: theme.accent }]}>
                      {copy.steadyLatest}
                    </Text>
                    <Text style={[styles.latestTitle, { color: theme.text }]} numberOfLines={2}>
                      {item.latest_issue.title}
                    </Text>
                    <Text style={[styles.latestTime, { color: theme.textMuted }]}>
                      {relativeTime(item.latest_issue.last_update)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </Card>
              </Pressable>
            )}

            {/* 경제 영향 — 주식·채권·물가·금리 */}
            {(item.impact?.length ?? 0) > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{copy.steadyImpact}</Text>
                <View style={[styles.impactBox, { backgroundColor: theme.accentSoft }]}>
                  {item.impact!.map((line, i) => (
                    <View key={i} style={styles.impactRow}>
                      <Text style={styles.impactEmoji}>👉</Text>
                      <Text style={[typography.body, { color: theme.text, flex: 1 }]}>{line}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 핵심 수치 표 */}
            {item.table && <SteadyTable table={item.table} />}

            {item.visual && (
              <Card>
                <MiniChart visual={item.visual} width={size.width - spacing.md * 4} />
              </Card>
            )}
          </ScrollView>

          {/* ② 상세 설명 (목업 2: 작은 제목 + "자세히 볼게요" 헤더 + 링크 안내) */}
          <ScrollView
            style={{ width: size.width }}
            contentContainerStyle={[styles.page, { paddingTop: insets.top + 56 }]}
            showsVerticalScrollIndicator={false}>
            <Text style={[styles.detailKicker, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.detailHeader, { color: theme.text }]}>{copy.steadyDetailHeader}</Text>
            {item.detail.map((para, i) => (
              <Card key={i}>
                <LinkedText
                  text={para.text}
                  refs={para.refs}
                  onPressRef={openIssue}
                  style={[typography.body, { color: theme.text }]}
                />
              </Card>
            ))}
            <Text style={[styles.refHint, { color: theme.textMuted }]}>{copy.steadyRefHint}</Text>
            <Text style={[styles.disclaimer, { color: theme.textMuted }]}>{copy.disclaimer}</Text>
          </ScrollView>
        </ScrollView>
      )}

      {/* 상단 오버레이 — 2칸 진행 세그먼트 + 닫기 */}
      <View style={[styles.topOverlay, { top: insets.top + spacing.sm }]}>
        <View style={styles.segments}>
          {[0, 1].map((i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i === page ? theme.accent : i < page ? theme.accentSoft : theme.hairline },
              ]}
            />
          ))}
        </View>
        <Pressable
          onPress={close}
          hitSlop={10}
          style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="close" size={18} color={theme.text} />
        </Pressable>
      </View>

      {/* 하단 힌트 + ‹› 보조 버튼 */}
      <View style={[styles.bottomRow, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Text style={[styles.hint, { color: theme.textMuted }]}>{copy.steadyHint}</Text>
        <View style={styles.navButtons}>
          <Pressable
            onPress={() => goTo(0)}
            disabled={page === 0}
            hitSlop={8}
            style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }, page === 0 && styles.navDisabled]}>
            <Ionicons name="chevron-back" size={16} color={theme.text} />
          </Pressable>
          <Pressable
            onPress={() => goTo(1)}
            disabled={page === 1}
            hitSlop={8}
            style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }, page === 1 && styles.navDisabled]}>
            <Ionicons name="chevron-forward" size={16} color={theme.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { paddingHorizontal: spacing.md, paddingBottom: 96, gap: spacing.md },
  statusNote: { fontSize: 13, ...font(700) },
  title: { ...typography.viewerTitle },
  oneLiner: { fontSize: 16, lineHeight: 25, ...font(400) },
  latestCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  latestIcon: { fontSize: 26 },
  latestBody: { flex: 1, gap: 2 },
  latestLabel: { fontSize: 12, ...font(700) },
  latestTitle: { fontSize: 15, ...font(700), lineHeight: 21 },
  latestTime: { ...typography.caption },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 17, ...font(800) },
  impactBox: { borderRadius: radius.card, padding: spacing.md, gap: spacing.sm },
  impactRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  impactEmoji: { fontSize: 15, lineHeight: 23 },
  detailKicker: { fontSize: 15, ...font(600) },
  detailHeader: { fontSize: 20, ...font(800), marginTop: -spacing.sm },
  refHint: { ...typography.caption, textAlign: 'center' },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: spacing.sm },
  topOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  segments: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 3, borderRadius: 2 },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hint: { ...typography.caption },
  navButtons: { flexDirection: 'row', gap: spacing.sm },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDisabled: { opacity: 0.4 },
});
