import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchJson } from '@/api/client';
import { feedPath } from '@/api/urls';
import { cacheKeys, readCache, writeCache } from '@/data/cache';
import { sortIssues } from '@/data/sort';
import type { FeedIndex, SortKey } from '@/data/types';

interface FeedState {
  feed: FeedIndex | null;
  /** 화면에 표시 중인 데이터가 만료된 캐시인지 (오프라인 안내용) */
  fromStaleCache: boolean;
  loading: boolean; // 표시할 데이터가 아예 없는 초기 로딩
  refreshing: boolean;
  error: Error | null;
}

export function useFeed(sort: SortKey) {
  const [state, setState] = useState<FeedState>({
    feed: null,
    fromStaleCache: false,
    loading: true,
    refreshing: false,
    error: null,
  });
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const revalidate = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setState((s) => ({ ...s, refreshing: true }));
    try {
      const fresh = await fetchJson<FeedIndex>(feedPath());
      await writeCache(cacheKeys.feed, fresh);
      if (!mounted.current) return;
      setState({ feed: fresh, fromStaleCache: false, loading: false, refreshing: false, error: null });
    } catch (e) {
      if (!mounted.current) return;
      setState((s) => ({
        ...s,
        loading: false,
        refreshing: false,
        // 캐시라도 보여주고 있으면 화면은 유지하고 배너만 띄운다
        error: e instanceof Error ? e : new Error(String(e)),
      }));
    }
  }, []);

  useEffect(() => {
    (async () => {
      const cached = await readCache<FeedIndex>(cacheKeys.feed);
      if (mounted.current && cached) {
        setState((s) => ({ ...s, feed: cached.data, fromStaleCache: cached.isStale, loading: false }));
      }
      await revalidate(false);
    })();
  }, [revalidate]);

  const refresh = useCallback(() => revalidate(true), [revalidate]);

  const issues = useMemo(
    () => (state.feed ? sortIssues(state.feed.issues, sort) : []),
    [state.feed, sort],
  );

  return { ...state, issues, refresh };
}
