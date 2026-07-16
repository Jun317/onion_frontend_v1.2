import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyView } from '@/components/common/StateViews';
import { GlossarySheet } from '@/components/glossary/GlossarySheet';
import { copy } from '@/constants/copy';
import type { GlossaryEntry } from '@/data/types';
import { usePrefs } from '@/lib/store';
import { font, radius, spacing, typography, useTheme } from '@/theme';

/** 내 단어장 — 용어 해설 시트에서 저장한 단어 목록. 행 탭 = 해설 다시 보기, ✕ = 삭제. */
export default function WordsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { words, toggleWord } = usePrefs();
  const [openEntry, setOpenEntry] = useState<GlossaryEntry | null>(null);

  const rows = [...words].reverse(); // 최근 저장이 위로

  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/my');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={10} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{copy.myWords(rows.length)}</Text>
      </View>

      {rows.length === 0 ? (
        <EmptyView emoji="📔" title={copy.myWordsEmpty} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.term}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setOpenEntry(item)}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.surface, borderColor: theme.border },
                pressed && { opacity: 0.7 },
              ]}>
              <View style={styles.rowBody}>
                <Text style={[styles.rowTerm, { color: theme.text }]}>{item.term}</Text>
                <Text style={[styles.rowEasy, { color: theme.textSecondary }]} numberOfLines={2}>
                  {item.easy}
                </Text>
              </View>
              <Pressable
                onPress={() => toggleWord(item)}
                hitSlop={8}
                style={[styles.deleteButton, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="close" size={14} color={theme.textMuted} />
              </Pressable>
            </Pressable>
          )}
        />
      )}

      <GlossarySheet entry={openEntry} onClose={() => setOpenEntry(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.title },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  rowBody: { flex: 1, gap: 2 },
  rowTerm: { fontSize: 15, ...font(700) },
  rowEasy: { ...typography.caption },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
