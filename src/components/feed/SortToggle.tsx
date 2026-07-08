import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SortKey } from '@/data/types';
import { useTheme } from '@/theme';

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'importance', label: '파급도순' },
  { key: 'latest', label: '최신순' },
];

/** 정렬 세그먼트 — 선택 요소 최소화 원칙에 따라 딱 2개 */
export function SortToggle({ sort, onChange }: { sort: SortKey; onChange: (s: SortKey) => void }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {OPTIONS.map((opt) => {
        const selected = opt.key === sort;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={[styles.segment, selected && { backgroundColor: theme.text }]}>
            <Text
              style={[
                styles.label,
                { color: selected ? theme.background : theme.textSecondary },
                selected && styles.labelSelected,
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
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    alignSelf: 'flex-start',
  },
  segment: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  labelSelected: { fontWeight: '700' },
});
