/** 상대 시간: "방금 전" / "37분 전" / "3시간 전" / "2일 전" / "6월 12일" */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (isNaN(then.getTime())) return '';
  const diffMs = now.getTime() - then.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}일 전`;
  return `${then.getMonth() + 1}월 ${then.getDate()}일`;
}

/** 숫자를 한국어 로케일로 (1,234.56) — 소수는 유효한 만큼만 */
export function formatNumber(v: number, maxFraction = 2): string {
  return v.toLocaleString('ko-KR', { maximumFractionDigits: maxFraction });
}

/**
 * 시리즈 period 라벨: "YYYY-MM" → "24.7월".
 * 백엔드에 "2025-11013" 같은 비정형 문자열이 실존하므로, 파싱 실패 시 원문 그대로.
 */
export function periodLabel(t: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(t);
  if (!m) return t;
  const year = m[1].slice(2);
  const month = parseInt(m[2], 10);
  if (month < 1 || month > 12) return t;
  return `${year}.${month}월`;
}

/** 앵커 값: 단위 붙여 표기 ("3.64%", "163.7억원") */
export function formatValueWithUnit(v: number, unit: string): string {
  return `${formatNumber(v)}${unit ?? ''}`;
}
