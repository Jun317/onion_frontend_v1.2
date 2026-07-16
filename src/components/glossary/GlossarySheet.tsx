import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { copy } from '@/constants/copy';
import type { GlossaryEntry } from '@/data/types';
import { usePrefs } from '@/lib/store';
import { font, motion, radius, spacing, typography, useTheme } from '@/theme';

interface Props {
  entry: GlossaryEntry | null;
  onClose: () => void;
}

/** 용어 해설 하단 시트 — Modal 기반 자체 구현 (외부 의존성 없음). 단어장 저장 토글 포함. */
export function GlossarySheet({ entry, onClose }: Props) {
  const { theme } = useTheme();
  const { isWordSaved, toggleWord } = usePrefs();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (entry) {
      slide.setValue(0);
      Animated.timing(slide, { toValue: 1, duration: motion.sheet, useNativeDriver: true }).start();
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
          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => toggleWord(entry)}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: isWordSaved(entry.term) ? theme.accentSoft : theme.accent,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.closeText,
                  { color: isWordSaved(entry.term) ? theme.accent : theme.onAccent },
                ]}>
                {isWordSaved(entry.term) ? copy.wordSaved : copy.wordSave}
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: theme.background, opacity: pressed ? 0.6 : 1 },
              ]}>
              <Text style={[styles.closeText, { color: theme.textSecondary }]}>알겠어요</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: spacing.md },
  term: { ...typography.title, marginBottom: spacing.sm },
  easy: { ...typography.body, fontSize: 16, lineHeight: 25, marginBottom: spacing.md },
  exampleBox: { borderRadius: radius.control, padding: spacing.md, marginBottom: spacing.md },
  exampleLabel: { ...typography.caption, marginBottom: spacing.xs },
  exampleText: { ...typography.body },
  buttonRow: { flexDirection: 'row', gap: spacing.sm },
  saveButton: { flex: 1, borderRadius: radius.control, alignItems: 'center', paddingVertical: 12 },
  closeButton: { flex: 1, borderRadius: radius.control, alignItems: 'center', paddingVertical: 12 },
  closeText: { fontSize: 16, ...font(600) },
});
