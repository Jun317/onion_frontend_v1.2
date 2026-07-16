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

import type { Category, GlossaryEntry } from '@/data/types';

import { ATTENDANCE_GOAL, calcStreak, dateKey } from './attendance';

export { ATTENDANCE_GOAL, calcStreak, dateKey } from './attendance';

/**
 * 사용자 로컬 상태 — 읽은 이슈(onion_read)·관심 분야(onion_interests)
 * ·단어장(onion_words)·출석(onion_attendance).
 * AsyncStorage 영속 + Context 로 피드 딜링·칩 정렬·마이 탭이 함께 반응한다.
 */

const READ_KEY = 'onion_read';
const INTERESTS_KEY = 'onion_interests';
const WORDS_KEY = 'onion_words';
const ATTENDANCE_KEY = 'onion_attendance';
/** 읽음 기록 상한 — 무한 성장 방지 (오래된 것부터 버림) */
const READ_CAP = 500;
/** 단어장 상한 */
const WORDS_CAP = 200;
/** 출석 기록 상한 (일 단위) */
const ATTENDANCE_CAP = 60;

type ReadMap = Record<string, number>; // issue id → 읽은 시각(ms)

interface PrefsValue {
  ready: boolean;
  read: ReadMap;
  interests: Category[];
  words: GlossaryEntry[];
  attendance: string[]; // 출석한 날 "YYYY-MM-DD" 목록
  streak: number;
  todayReadCount: number;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  unmarkRead: (id: string) => void;
  toggleInterest: (category: Category) => void;
  isWordSaved: (term: string) => boolean;
  toggleWord: (entry: GlossaryEntry) => void;
}

const PrefsContext = createContext<PrefsValue>({
  ready: false,
  read: {},
  interests: [],
  words: [],
  attendance: [],
  streak: 0,
  todayReadCount: 0,
  isRead: () => false,
  markRead: () => {},
  unmarkRead: () => {},
  toggleInterest: () => {},
  isWordSaved: () => false,
  toggleWord: () => {},
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
  const [words, setWords] = useState<GlossaryEntry[]>([]);
  const [attendance, setAttendance] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [rawRead, rawInterests, rawWords, rawAttendance] = await AsyncStorage.multiGet([
          READ_KEY,
          INTERESTS_KEY,
          WORDS_KEY,
          ATTENDANCE_KEY,
        ]);
        if (rawRead[1]) setRead(JSON.parse(rawRead[1]) as ReadMap);
        if (rawInterests[1]) setInterests(JSON.parse(rawInterests[1]) as Category[]);
        if (rawWords[1]) setWords(JSON.parse(rawWords[1]) as GlossaryEntry[]);
        if (rawAttendance[1]) setAttendance(JSON.parse(rawAttendance[1]) as string[]);
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

  const toggleWord = useCallback((entry: GlossaryEntry) => {
    const key = entry.term.trim().toLowerCase();
    setWords((prev) => {
      const exists = prev.some((w) => w.term.trim().toLowerCase() === key);
      const next = exists
        ? prev.filter((w) => w.term.trim().toLowerCase() !== key)
        : [...prev, entry].slice(-WORDS_CAP);
      persist(WORDS_KEY, next);
      return next;
    });
  }, []);

  const isWordSaved = useCallback(
    (term: string) => words.some((w) => w.term.trim().toLowerCase() === term.trim().toLowerCase()),
    [words],
  );

  const isRead = useCallback((id: string) => id in read, [read]);

  const todayReadCount = useMemo(() => {
    const today = dateKey(Date.now());
    return Object.values(read).filter((ms) => dateKey(ms) === today).length;
  }, [read]);

  // 오늘 읽은 이슈가 목표에 도달하면 출석 기록 — 읽기가 곧 출석 (P2 리텐션 루프)
  useEffect(() => {
    if (!ready || todayReadCount < ATTENDANCE_GOAL) return;
    const today = dateKey(Date.now());
    setAttendance((prev) => {
      if (prev.includes(today)) return prev;
      const next = [...prev, today].slice(-ATTENDANCE_CAP);
      persist(ATTENDANCE_KEY, next);
      return next;
    });
  }, [ready, todayReadCount]);

  const streak = useMemo(() => calcStreak(attendance), [attendance]);

  const value = useMemo(
    () => ({
      ready,
      read,
      interests,
      words,
      attendance,
      streak,
      todayReadCount,
      isRead,
      markRead,
      unmarkRead,
      toggleInterest,
      isWordSaved,
      toggleWord,
    }),
    [
      ready,
      read,
      interests,
      words,
      attendance,
      streak,
      todayReadCount,
      isRead,
      markRead,
      unmarkRead,
      toggleInterest,
      isWordSaved,
      toggleWord,
    ],
  );

  return createElement(PrefsContext.Provider, { value }, children);
}

export function usePrefs(): PrefsValue {
  return useContext(PrefsContext);
}
