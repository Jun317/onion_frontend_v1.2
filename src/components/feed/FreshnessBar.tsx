import { StyleSheet, Text, View } from 'react-native';

import { typography, useTheme } from '@/theme';
import { relativeTime } from '@/utils/format';

/** 데이터 신선도 표시 — 백엔드는 1시간 주기로 갱신된다 */
export function FreshnessBar({ generatedAt, offline }: { generatedAt: string | null; offline: boolean }) {
  const { theme } = useTheme();
  if (!generatedAt) return null;
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: offline ? theme.textMuted : '#0ca30c' }]} />
      <Text style={[styles.text, { color: theme.textMuted }]}>
        {offline ? '오프라인 — 저장된 소식이에요' : `${relativeTime(generatedAt)} 업데이트`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { ...typography.caption },
});
