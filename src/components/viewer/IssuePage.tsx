import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/common/Card';
import { CategoryBadge } from '@/components/common/CategoryBadge';
import { HeroStat } from '@/components/common/HeroStat';
import { KeyStatTiles } from '@/components/common/KeyStatTiles';
import { MiniChart } from '@/components/common/MiniChart';
import { GlossaryText } from '@/components/glossary/GlossaryText';
import { copy } from '@/constants/copy';
import type { HeadlineStat, IssueCard } from '@/data/types';
import { useIssue } from '@/data/useIssue';
import { cardShadow, categoryColor, font, radius, spacing, tint, typography, useTheme } from '@/theme';
import { formatNumber, relativeTime } from '@/utils/format';

import { DetailPane } from './DetailPane';

// 웹(모바일 Safari 포함) 가로 페이저: 세로 페이저에 통한 것과 동일하게 RN JS 페이징을 끄고
// 순수 CSS 스냅만 사용(둘이 겹치면 "한 번 걸림"이 생김). 컨테이너 = x mandatory,
// 자식 = snap start + stop always → 한 스와이프에 한 페이지로 확실히 스냅.
const WEB_HSNAP_CONTAINER =
  Platform.OS === 'web'
    ? ({ scrollSnapType: 'x mandatory', scrollBehavior: 'auto' } as unknown as ViewStyle)
    : undefined;
const WEB_HSNAP_CHILD =
  Platform.OS === 'web'
    ? ({ scrollSnapAlign: 'start', scrollSnapStop: 'always' } as unknown as ViewStyle)
    : undefined;
const IS_WEB = Platform.OS === 'web';

/**
 * headline_stat 부재 시 상세 anchors[0] 로 파생하는 폴백 스탯.
 * 표기 규칙은 백엔드 export._headline_stat 과 동일하게 맞춘다 (프론트 창작 금지).
 */
function deriveStat(anchors?: { entity: string; metric: string; value: number; unit: string; prev: number | null }[]): HeadlineStat | null {
  const a = anchors?.find((x) => x.value != null && x.metric !== '변동폭');
  if (!a) return null;
  const stat: HeadlineStat = {
    label: `${a.entity} ${a.metric}`.trim(),
    value: formatNumber(a.value),
    unit: a.unit ?? '',
    delta_text: null,
    direction: 'flat',
    prev_text: null,
  };
  if (a.prev != null) {
    const delta = a.value - a.prev;
    const deltaUnit = a.unit === '%' ? '%p' : a.unit ?? '';
    stat.direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
    stat.delta_text = `${delta > 0 ? '+' : delta < 0 ? '-' : '±'}${formatNumber(Math.abs(delta))}${deltaUnit}`;
    stat.prev_text = `직전 ${formatNumber(a.prev)}${a.unit ?? ''}`;
  }
  return stat;
}

interface Props {
  card: IssueCard;
  isActive: boolean; // 현재±1 페이지만 상세 fetch
  width: number;
  height: number;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDetailOpenChange: (open: boolean) => void;
}

/**
 * 이슈 한 페이지 = 가로 2페이지 (① 히어로 ↔ ② 상세) — 옆으로 넘기면 자세한 내용.
 * v4.1: '더 알아보기' Modal 시트를 페이지 전환으로 대체 — Modal 중첩(상세+용어 시트)이
 * Android 에서 화면 프리즈를 일으키던 문제의 구조적 해결.
 * 상세 페이지에 있는 동안은 부모 세로 페이저를 잠근다 (onDetailOpenChange).
 */
export function IssuePage({
  card,
  isActive,
  width,
  height,
  index,
  total,
  onPrev,
  onNext,
  onDetailOpenChange,
}: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { detail, error, retry } = useIssue(card.id, isActive);
  const [page, setPage] = useState(0);
  const hScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    onDetailOpenChange(page > 0);
  }, [page, onDetailOpenChange]);

  // 현재 페이지(0=히어로,1=상세) 갱신 — 웹 트랙패드/휠은 momentum 이벤트가 없어서
  // onScroll 로도 갱신해야 닷·세로 잠금(onDetailOpenChange)이 정확히 따라온다.
  const syncPage = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage((prev) => (prev === p ? prev : p));
  };
  const goToPage = (p: number) => hScrollRef.current?.scrollTo({ x: p * width, animated: true });

  const glossary = detail?.glossary ?? [];
  const whyNow = detail?.why_now ?? card.why_now;
  // 히어로 밀도 보장: headline_stat 이 없으면 상세의 첫 앵커로 스탯을 파생
  const stat = card.headline_stat ?? detail?.headline_stat ?? deriveStat(detail?.anchors);
  const impactLine = detail?.impact_line ?? card.impact_line;
  const eventAt = card.event_at ?? card.last_update;
  const showUpdated =
    !card.date_label &&
    !!card.event_at &&
    new Date(card.last_update).getTime() - new Date(card.event_at).getTime() > 60 * 60_000;
  const background = tint(categoryColor(card.category), 0.05);
  const bottomBarHeight = insets.bottom + 64;

  return (
    <View style={[styles.page, { width, height, backgroundColor: background }]}>
      <ScrollView
        ref={hScrollRef}
        horizontal
        pagingEnabled={!IS_WEB}
        style={WEB_HSNAP_CONTAINER}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={syncPage}
        scrollEventThrottle={32}
        onMomentumScrollEnd={syncPage}
        nestedScrollEnabled>
        {/* ① 히어로 — 한 화면에 꽉 맞춘 요약(내부 세로 스크롤 없음 → 세로 제스처는 항상 다음 이슈).
            넘치는 전체 내용은 옆으로 넘기는 상세 페인에. flexGap 스페이서가 남는 공간을 분배. */}
        <View style={[styles.heroPage, { width, height: height - bottomBarHeight }, WEB_HSNAP_CHILD]}>
          <View style={styles.topRow}>
            <CategoryBadge category={card.category} size="md" />
            <View style={styles.timeCol}>
              <Text style={[styles.time, { color: theme.textMuted }]} numberOfLines={1}>
                {card.date_label ?? relativeTime(eventAt)}
              </Text>
              {showUpdated && (
                <Text style={[styles.timeSub, { color: theme.textMuted }]}>
                  {copy.updatedAt(relativeTime(card.last_update))}
                </Text>
              )}
            </View>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>{card.title}</Text>

          {card.one_liner !== card.title && (
            <GlossaryText
              text={card.one_liner}
              glossary={glossary}
              numberOfLines={2}
              style={[styles.oneLiner, { color: theme.textSecondary }]}
            />
          )}

          <View style={styles.flexGap} />

          {card.key_stats && card.key_stats.length > 0 ? (
            <KeyStatTiles stats={card.key_stats} />
          ) : (
            stat && <HeroStat stat={stat} />
          )}

          <View style={styles.flexGap} />

          {detail?.visual && (
            <Card style={styles.chartCard}>
              <MiniChart visual={detail.visual} width={width - spacing.md * 4} />
            </Card>
          )}

          <View style={styles.flexGap} />

          {!!whyNow && (
            <Card style={styles.calloutCard}>
              <Text style={[styles.calloutLabel, { color: theme.textMuted }]}>{copy.whyNow}</Text>
              <GlossaryText
                text={whyNow}
                glossary={glossary}
                numberOfLines={3}
                style={[typography.body, { color: theme.textSecondary }]}
              />
            </Card>
          )}

          {!!impactLine && (
            <Card style={styles.calloutCard}>
              <Text style={[styles.calloutLabel, { color: theme.accent }]}>{copy.impactLine}</Text>
              <GlossaryText
                text={impactLine}
                glossary={glossary}
                numberOfLines={3}
                style={[styles.impactText, { color: theme.text }]}
              />
            </Card>
          )}
        </View>

        {/* ② 상세 — 같은 배경 위 비모달 페인 */}
        <DetailPane
          card={card}
          detail={detail}
          error={error}
          onRetry={retry}
          width={width}
          bottomInset={bottomBarHeight}
          snapStyle={WEB_HSNAP_CHILD}
        />
      </ScrollView>

      {/* 하단 고정: 스와이프 힌트(탭 = 페이지 전환) + 위치 + ↑↓ */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable onPress={() => goToPage(page === 0 ? 1 : 0)} hitSlop={6} style={styles.hintRow}>
          <View style={styles.dots}>
            {[0, 1].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === page ? theme.accent : theme.axis },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>
            {page === 0 ? copy.swipeToDetail : copy.swipeToSummary}
          </Text>
        </Pressable>
        <View style={styles.navRow}>
          <Text style={[styles.position, { color: theme.textMuted }]}>
            {copy.pagerPosition(index + 1, total)}
          </Text>
          <View style={styles.navButtons}>
            <Pressable
              onPress={onPrev}
              disabled={index === 0}
              hitSlop={8}
              style={[styles.navButton, { backgroundColor: theme.surface }, index === 0 && styles.navDisabled]}>
              <Ionicons name="chevron-up" size={16} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={onNext}
              disabled={index === total - 1}
              hitSlop={8}
              style={[styles.navButton, { backgroundColor: theme.surface }, index === total - 1 && styles.navDisabled]}>
              <Ionicons name="chevron-down" size={16} color={theme.text} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { overflow: 'hidden' },
  // paddingTop 48 = 페이저 상단 오버레이(진행 세그먼트+닫기)와 겹침 방지.
  // 한 화면 고정 높이 + overflow hidden → 내부 세로 스크롤 없이 요약이 한 화면에 안착.
  // flexGap 스페이서가 남는 세로 공간을 블록 사이에 배분 — 하단 공백 대신 호흡으로.
  heroPage: {
    paddingHorizontal: spacing.md,
    paddingTop: 48,
    paddingBottom: spacing.sm,
    gap: spacing.md,
    overflow: 'hidden',
  },
  flexGap: { flexGrow: 1, flexShrink: 1, minHeight: 2 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  timeCol: { alignItems: 'flex-end', gap: 1, flexShrink: 1, marginLeft: spacing.sm },
  time: { ...typography.caption },
  timeSub: { ...typography.micro, opacity: 0.8 },
  title: { ...typography.viewerTitle },
  oneLiner: { fontSize: 16, lineHeight: 25, ...font(400) },
  chartCard: { paddingVertical: spacing.md },
  calloutCard: { gap: 6 },
  calloutLabel: { fontSize: 13, ...font(700), letterSpacing: 0.2 },
  impactText: { fontSize: 15.5, lineHeight: 24, ...font(500) },
  bottom: { paddingHorizontal: spacing.md, gap: spacing.xs, zIndex: 1 },
  hintRow: { alignItems: 'center', gap: 5, paddingVertical: 2 },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  hint: { fontSize: 13, ...font(600) },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  position: { ...typography.caption },
  navButtons: { flexDirection: 'row', gap: spacing.sm },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  navDisabled: { opacity: 0.35 },
});
