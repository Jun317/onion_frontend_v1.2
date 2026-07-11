import { Pressable, StyleSheet, Text } from 'react-native';

import { font, radius, tint, useTheme } from '@/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * 선택 칩 — §2 공통 규칙: 미선택 = 아주 연한 보라(accent 6%) + accent 14% 테두리,
 * 선택 = 짙은 보라(accent) 배경 + 흰 글자. 검정 배경 금지.
 */
export function CategoryChip({ label, selected, onPress }: Props) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: theme.accent, borderColor: theme.accent }
          : { backgroundColor: tint(theme.accent, 0.06), borderColor: tint(theme.accent, 0.14) },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.label, { color: selected ? theme.onAccent : theme.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pressed: { opacity: 0.7 },
  label: { fontSize: 13, ...font(600) },
});
