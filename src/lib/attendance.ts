/** 출석 스트릭 순수 로직 — store.ts(상태)와 분리해 node 스크립트에서도 검증 가능하게 유지 */

/** 하루에 이만큼 읽으면 출석 인정 — 출석의 조건을 "읽기"로 정의 (뉴스앱 본질과 정렬) */
export const ATTENDANCE_GOAL = 3;

/** 로컬 기준 일자 키 "YYYY-MM-DD" */
export function dateKey(ms: number): string {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** 연속 출석일 — 오늘(또는 어제)부터 뒤로 끊기지 않은 날 수 */
export function calcStreak(days: string[], nowMs: number = Date.now()): number {
  const set = new Set(days);
  const DAY = 24 * 60 * 60_000;
  let cursor = nowMs;
  // 오늘 아직 출석 전이면 어제부터 세기 시작 (스트릭은 자정이 아니라 미출석으로만 끊긴다)
  if (!set.has(dateKey(cursor))) cursor -= DAY;
  let streak = 0;
  while (set.has(dateKey(cursor))) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}
