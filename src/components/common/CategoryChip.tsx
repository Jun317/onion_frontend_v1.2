import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font, radius, tint, useTheme } from '@/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** 카테고리 색 — 점·미선택 틴트에 사용. 없으면 accent (예: '전체' 칩) */
  color?: string;
}

/**
 * 선택 칩 — 카테고리 색 점 + 해당 색 6% 틴트 배경 (목업 1 양식).
 * 선택 = 짙은 보라(accent) 배경 + 흰 글자 (§2 공통 규칙). 검정 배경 금지.
 */
export function CategoryChip({ label, selected, onPress, color }: Props) {
  const { theme } = useTheme();
  const base = color ?? theme.accent;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: theme.accent, borderColor: theme.accent }
          : { backgroundColor: tint(base, 0.06), borderColor: tint(base, 0.14) },
        pressed && styles.pressed,
      ]}>
      {!!color && (
        <View style={[styles.dot, { backgroundColor: selected ? theme.onAccent : color }]} />
      )}
      <Text
        style={[
          styles.label,
          { color: selected ? theme.onAccent : color ? theme.textSecondary : theme.accent },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pressed: { opacity: 0.7 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 13, ...font(600) },
});
