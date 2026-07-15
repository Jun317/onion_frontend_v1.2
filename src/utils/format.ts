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
 * 시리즈 period 라벨: "YYYY-MM"·"YYYY-MM-DD" → "24.7월"·"24.7.15", "YYYY-nQ" → "24.1분기".
 * 백엔드에 "2025-11013" 같은 비정형 문자열이 실존 — 파싱 실패 시 원문을 그대로 뿌리면
 * 라벨이 길어져 겹침(charts QA 결함)을 유발하므로, 파싱 가능한 접두부만 쓰고
 * 그것도 안 되면 빈 문자열(라벨 숨김)을 반환한다.
 */
export function periodLabel(t: string): string {
  const s = (t ?? '').trim();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (ymd) {
    const [, y, m, d] = ymd;
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31)
      return `${y.slice(2)}.${month}.${day}`;
  }
  const quarter = /^(\d{4})-([1-4])Q/.exec(s);
  if (quarter) return `${quarter[1].slice(2)}.${quarter[2]}분기`;
  const ym = /^(\d{4})-(\d{2})/.exec(s);
  if (ym) {
    const month = parseInt(ym[2], 10);
    if (month >= 1 && month <= 12) return `${ym[1].slice(2)}.${month}월`;
  }
  const yearOnly = /^(\d{4})/.exec(s);
  if (yearOnly) return `${yearOnly[1].slice(2)}년`;
  return ''; // 비정형 — 라벨 숨김 (원문 노출 금지)
}

/** 차트 실데이터 범위 캡션: "25.1월 – 26.7월". 라벨 산출 불가 구간은 생략. */
export function periodRange(series: { t: string }[]): string {
  if (!series || series.length === 0) return '';
  const first = periodLabel(series[0].t);
  const last = periodLabel(series[series.length - 1].t);
  if (!first || !last) return '';
  if (first === last) return first;
  return `${first} – ${last}`;
}

/** 글자 중 한글 비율 (공백 제외) — 영어 원문 헤드라인 판별용 (백엔드 _korean_ratio 대응) */
export function koreanRatio(text: string): number {
  const letters = [...(text ?? '')].filter((c) => c.trim().length > 0);
  if (letters.length === 0) return 0;
  const hangul = letters.filter((c) => c >= '가' && c <= '힣').length;
  return hangul / letters.length;
}

/** 앵커 값: 단위 붙여 표기 ("3.64%", "163.7억원") */
export function formatValueWithUnit(v: number, unit: string): string {
  return `${formatNumber(v)}${unit ?? ''}`;
}
