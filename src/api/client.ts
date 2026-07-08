import { FALLBACK_BASE, PRIMARY_BASE } from './urls';

const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * PRIMARY(GitHub Pages) → 실패 시 FALLBACK(raw.githubusercontent) 순서로 시도.
 * 둘 다 실패하면 마지막 오류를 던진다.
 */
export async function fetchJson<T>(path: string): Promise<T> {
  let lastError: unknown;
  for (const base of [PRIMARY_BASE, FALLBACK_BASE]) {
    try {
      const res = await fetchWithTimeout(base + path);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} (${base + path})`);
        continue;
      }
      return (await res.json()) as T;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
