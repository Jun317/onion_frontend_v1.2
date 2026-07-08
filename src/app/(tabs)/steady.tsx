import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyView } from '@/components/common/StateViews';
import { spacing, useTheme } from '@/theme';

/** 스테디 이슈 — 장기 팔로우 이슈 탭 (이번 버전은 준비 중) */
export default function SteadyScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + spacing.sm }]}>
      <Text style={[styles.logo, { color: theme.text }]}>스테디 이슈</Text>
      <EmptyView
        emoji="🌱"
        title="준비 중이에요"
        subtitle={'오래 두고 볼 큰 이슈들을 모으고 있어요.\n다음 업데이트에서 만나요!'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logo: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, paddingHorizontal: spacing.md },
});
