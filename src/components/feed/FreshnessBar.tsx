import { StyleSheet, Text, View } from 'react-native';

import { copy } from '@/constants/copy';
import { typography, useTheme } from '@/theme';
import { relativeTime } from '@/utils/format';

/**
 * 데이터 신선도 표시 — 라이브 피드는 "N분 전 업데이트", 큐레이션 스냅샷(v4)은
 * 시간이 흘러도 늙지 않는 "YYYY.M.D 기준" 고정 라벨을 쓴다.
 */
export function FreshnessBar({
  generatedAt,
  offline,
  snapshot = false,
}: {
  generatedAt: string | null;
  offline: boolean;
  snapshot?: boolean;
}) {
  const { theme } = useTheme();
  if (!generatedAt) return null;
  let label: string;
  if (snapshot) {
    const d = new Date(generatedAt);
    label = isNaN(d.getTime())
      ? copy.freshnessSnapshot(generatedAt)
      : copy.freshnessSnapshot(`${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`);
  } else {
    label = offline ? copy.freshnessOffline : copy.freshnessUpdated(relativeTime(generatedAt));
  }
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: offline ? theme.textMuted : theme.success }]} />
      <Text style={[styles.text, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { ...typography.caption },
});
