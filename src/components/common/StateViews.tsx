import { Pressable, StyleSheet, Text, View } from 'react-native';

import { copy } from '@/constants/copy';
import { font, radius, spacing, typography, useTheme } from '@/theme';

export function ErrorView({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>😵</Text>
      <Text style={[styles.title, { color: theme.text }]}>{message ?? copy.errorTitle}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{copy.errorSubtitle}</Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.retryButton,
            { backgroundColor: theme.accent, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Text style={[styles.retryText, { color: theme.onAccent }]}>{copy.retry}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyView({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {!!subtitle && <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
    </View>
  );
}

/** 리스트 로딩 스켈레톤 — 애니메이션 없는 정적 블록 (단순화) */
export function SkeletonCards({ count = 6 }: { count?: number }) {
  const { theme } = useTheme();
  return (
    <View style={{ padding: spacing.md, gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.skeletonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.skeletonLine, { backgroundColor: theme.hairline, width: 64 }]} />
          <View style={[styles.skeletonLine, { backgroundColor: theme.hairline, width: '86%', height: 18 }]} />
          <View style={[styles.skeletonLine, { backgroundColor: theme.hairline, width: '60%' }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emoji: { fontSize: 44, marginBottom: spacing.xs },
  title: { ...typography.title, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center' },
  retryButton: {
    marginTop: spacing.md,
    borderRadius: radius.control,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  retryText: { fontSize: 16, ...font(700) },
  skeletonCard: {
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.sm,
  },
  skeletonLine: { height: 12, borderRadius: 6 },
});
