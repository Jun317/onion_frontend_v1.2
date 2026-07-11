import { StyleSheet, Text, View } from 'react-native';

import type { Category } from '@/data/types';
import { categoryColor, categoryLabel, font, radius, tint } from '@/theme';

/** 카테고리 배지 — 색 + 한글 라벨을 항상 함께 (색만으로 의미 전달 금지) */
export function CategoryBadge({ category, size = 'sm' }: { category: Category | string; size?: 'sm' | 'md' }) {
  const color = categoryColor(category);
  return (
    <View style={[styles.badge, { backgroundColor: tint(color, 0.13) }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, size === 'md' && styles.labelMd, { color }]}>
        {categoryLabel(category)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, ...font(700) },
  labelMd: { fontSize: 14 },
});
