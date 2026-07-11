import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SortKey } from '@/data/types';
import { font, radius, tint, useTheme } from '@/theme';

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'importance', label: '파급도순' },
  { key: 'latest', label: '최신순' },
];

/** 정렬 세그먼트 — 딱 2개. 선택 = accent 보라 배경 + 흰 글자 (§2 칩·토글 규칙) */
export function SortToggle({ sort, onChange }: { sort: SortKey; onChange: (s: SortKey) => void }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { borderColor: tint(theme.accent, 0.14) }]}>
      {OPTIONS.map((opt) => {
        const selected = opt.key === sort;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            hitSlop={8}
            style={[styles.segment, selected && { backgroundColor: theme.accent }]}>
            <Text
              style={[
                styles.label,
                selected ? { color: theme.onAccent, ...font(700) } : { color: theme.textSecondary },
              ]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: 3,
    alignSelf: 'flex-start',
  },
  segment: { borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 6 },
  label: { fontSize: 13, ...font(500) },
});
