import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchJson } from '@/api/client';
import { issuePath } from '@/api/urls';
import { cacheKeys, readCache, writeCache } from '@/data/cache';
import { normalizeDetail } from '@/data/normalize';
import type { IssueDetail } from '@/data/types';

interface IssueState {
  detail: IssueDetail | null;
  loading: boolean;
  error: Error | null;
}

/**
 * 이슈 상세 훅 — 캐시 즉시 표시 후 백그라운드 재검증.
 * enabled=false 면 아무것도 하지 않는다 (뷰어에서 현재±1 페이지만 fetch).
 */
export function useIssue(id: string | null, enabled = true) {
  const [state, setState] = useState<IssueState>({ detail: null, loading: false, error: null });
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setState((s) => ({ ...s, loading: s.detail === null, error: null }));
    const cached = await readCache<IssueDetail>(cacheKeys.issue(id));
    if (mounted.current && cached) {
      setState({ detail: normalizeDetail(cached.data), loading: false, error: null });
      if (!cached.isStale) return; // 신선한 캐시면 네트워크 생략
    }
    try {
      const fresh = await fetchJson<IssueDetail>(issuePath(id));
      await writeCache(cacheKeys.issue(id), fresh);
      if (!mounted.current) return;
      setState({ detail: normalizeDetail(fresh), loading: false, error: null });
    } catch (e) {
      if (!mounted.current) return;
      setState((s) => ({
        detail: s.detail, // 만료 캐시라도 있으면 유지
        loading: false,
        error: s.detail ? null : e instanceof Error ? e : new Error(String(e)),
      }));
    }
  }, [id]);

  useEffect(() => {
    if (enabled && id) load();
  }, [enabled, id, load]);

  return { ...state, retry: load };
}
