import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Category } from '@/data/types';

/**
 * 사용자 로컬 상태 — 읽은 이슈(onion_read)·관심 분야(onion_interests).
 * AsyncStorage 영속 + Context 로 피드 딜링·칩 정렬·마이 탭이 함께 반응한다.
 */

const READ_KEY = 'onion_read';
const INTERESTS_KEY = 'onion_interests';
/** 읽음 기록 상한 — 무한 성장 방지 (오래된 것부터 버림) */
const READ_CAP = 500;

type ReadMap = Record<string, number>; // issue id → 읽은 시각(ms)

interface PrefsValue {
  ready: boolean;
  read: ReadMap;
  interests: Category[];
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  unmarkRead: (id: string) => void;
  toggleInterest: (category: Category) => void;
}

const PrefsContext = createContext<PrefsValue>({
  ready: false,
  read: {},
  interests: [],
  isRead: () => false,
  markRead: () => {},
  unmarkRead: () => {},
  toggleInterest: () => {},
});

async function persist(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 치명적이지 않음 — 메모리 상태는 유지된다
  }
}

function pruneRead(map: ReadMap): ReadMap {
  const ids = Object.keys(map);
  if (ids.length <= READ_CAP) return map;
  const keep = ids.sort((a, b) => map[b] - map[a]).slice(0, READ_CAP);
  return Object.fromEntries(keep.map((id) => [id, map[id]]));
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [read, setRead] = useState<ReadMap>({});
  const [interests, setInterests] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [rawRead, rawInterests] = await AsyncStorage.multiGet([READ_KEY, INTERESTS_KEY]);
        if (rawRead[1]) setRead(JSON.parse(rawRead[1]) as ReadMap);
        if (rawInterests[1]) setInterests(JSON.parse(rawInterests[1]) as Category[]);
      } catch {
        // 손상된 저장값은 초기 상태로 시작
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const markRead = useCallback((id: string) => {
    setRead((prev) => {
      if (prev[id]) return prev; // 최초 읽은 시각 유지
      const next = pruneRead({ ...prev, [id]: Date.now() });
      persist(READ_KEY, next);
      return next;
    });
  }, []);

  const unmarkRead = useCallback((id: string) => {
    setRead((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      persist(READ_KEY, next);
      return next;
    });
  }, []);

  const toggleInterest = useCallback((category: Category) => {
    setInterests((prev) => {
      const next = prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category];
      persist(INTERESTS_KEY, next);
      return next;
    });
  }, []);

  const isRead = useCallback((id: string) => id in read, [read]);

  const value = useMemo(
    () => ({ ready, read, interests, isRead, markRead, unmarkRead, toggleInterest }),
    [ready, read, interests, isRead, markRead, unmarkRead, toggleInterest],
  );

  return createElement(PrefsContext.Provider, { value }, children);
}

export function usePrefs(): PrefsValue {
  return useContext(PrefsContext);
}
