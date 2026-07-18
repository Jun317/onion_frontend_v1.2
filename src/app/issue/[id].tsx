import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorView, SkeletonCards } from '@/components/common/StateViews';
import { IssuePager } from '@/components/viewer/IssuePager';
import type { SortKey } from '@/data/types';
import { useFeed } from '@/data/useFeed';
import { useIssue } from '@/data/useIssue';
import { useTheme } from '@/theme';

/**
 * 풀스크린 이슈 뷰어 라우트.
 * 리스트에서 보던 정렬 순서 그대로 세로 페이저를 구성하고, 탭한 이슈에서 시작한다.
 */
export default function IssueViewerScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; sort?: string }>();
  const sort: SortKey = params.sort === 'latest' ? 'latest' : 'importance';
  const { issues, loading, refresh } = useFeed(sort);

  const initialIndex = useMemo(
    () => issues.findIndex((i) => i.id === params.id),
    [issues, params.id],
  );

  // 피드에 없는 이슈(관련 이슈 등으로 진입)는 상세를 직접 받아 단일 페이지로 보여준다
  const needsFallback = !loading && issues.length > 0 && initialIndex === -1;
  const fallback = useIssue(needsFallback ? params.id : null, needsFallback);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (loading && issues.length === 0) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        <SkeletonCards count={1} />
      </View>
    );
  }

  if (issues.length === 0) {
    return (
      <View style={[styles.fill, { backgroundColor: theme.background }]}>
        <ErrorView onRetry={refresh} />
      </View>
    );
  }

  if (needsFallback) {
    if (fallback.error) {
      return (
        <View style={[styles.fill, { backgroundColor: theme.background }]}>
          <ErrorView onRetry={fallback.retry} />
        </View>
      );
    }
    if (!fallback.detail) {
      return (
        <View style={[styles.fill, { backgroundColor: theme.background }]}>
          <SkeletonCards count={1} />
        </View>
      );
    }
    return (
      <IssuePager issues={[fallback.detail]} initialIndex={0} onClose={close} />
    );
  }

  return (
    <IssuePager
      issues={issues}
      initialIndex={Math.max(0, initialIndex)}
      onClose={close}
    />
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
