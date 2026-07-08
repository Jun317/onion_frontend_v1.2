import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import type { GlossaryEntry } from '@/data/types';
import { spacing, typography, useTheme } from '@/theme';

interface Props {
  entry: GlossaryEntry | null;
  onClose: () => void;
}

/** 용어 해설 하단 시트 — Modal 기반 자체 구현 (외부 의존성 없음) */
export function GlossarySheet({ entry, onClose }: Props) {
  const { theme } = useTheme();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (entry) {
      slide.setValue(0);
      Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }
  }, [entry, slide]);

  if (!entry) return null;

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [80, 0] });

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.overlay }]} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: theme.surface, borderColor: theme.border, transform: [{ translateY }] },
          ]}
          // 시트 내부 탭이 backdrop 닫기로 전파되지 않게
          onStartShouldSetResponder={() => true}>
          <View style={[styles.grabber, { backgroundColor: theme.hairline }]} />
          <Text style={[styles.term, { color: theme.text }]}>{entry.term}</Text>
          <Text style={[styles.easy, { color: theme.text }]}>{entry.easy}</Text>
          {!!entry.example && (
            <View style={[styles.exampleBox, { backgroundColor: theme.background }]}>
              <Text style={[styles.exampleLabel, { color: theme.textMuted }]}>예를 들면</Text>
              <Text style={[styles.exampleText, { color: theme.textSecondary }]}>{entry.example}</Text>
            </View>
          )}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: theme.background, opacity: pressed ? 0.6 : 1 },
            ]}>
            <Text style={[styles.closeText, { color: theme.textSecondary }]}>알겠어요</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: spacing.md },
  term: { ...typography.title, marginBottom: spacing.sm },
  easy: { ...typography.body, marginBottom: spacing.md },
  exampleBox: { borderRadius: 12, padding: spacing.md, marginBottom: spacing.md },
  exampleLabel: { ...typography.caption, marginBottom: spacing.xs },
  exampleText: { fontSize: 15, lineHeight: 23 },
  closeButton: { borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  closeText: { fontSize: 16, fontWeight: '600' },
});
