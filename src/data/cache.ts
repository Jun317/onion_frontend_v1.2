import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'onion:';

interface CacheEnvelope<T> {
  savedAt: number;
  data: T;
}

export interface Cached<T> {
  data: T;
  savedAt: number;
  /** TTL(백엔드 갱신 주기 1시간)을 넘긴 캐시인지 */
  isStale: boolean;
}

export const TTL_MS = 60 * 60 * 1000;

export async function readCache<T>(key: string): Promise<Cached<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const env = JSON.parse(raw) as CacheEnvelope<T>;
    return {
      data: env.data,
      savedAt: env.savedAt,
      isStale: Date.now() - env.savedAt > TTL_MS,
    };
  } catch {
    return null; // 캐시 손상은 없는 것과 동일하게 취급
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    const env: CacheEnvelope<T> = { savedAt: Date.now(), data };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(env));
  } catch {
    // 저장 실패는 치명적이지 않음 (다음 fetch 에서 재시도)
  }
}

export const cacheKeys = {
  feed: 'feed',
  issue: (id: string) => `issue:${id}`,
  hintSeen: 'hint-seen',
};
