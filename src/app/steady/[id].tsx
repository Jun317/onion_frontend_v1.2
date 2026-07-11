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
import { copy } from '@/constants/copy';
import { useFeed } from '@/data/useFeed';
import { font, radius, spacing, tint, typography, useTheme } from '@/theme';

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
          {/* ① 개요 */}
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
            {item.visual && (
              <Card>
                <MiniChart visual={item.visual} width={size.width - spacing.md * 4} />
              </Card>
            )}
          </ScrollView>

          {/* ② 상세 설명 */}
          <ScrollView
            style={{ width: size.width }}
            contentContainerStyle={[styles.page, { paddingTop: insets.top + 56 }]}
            showsVerticalScrollIndicator={false}>
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
