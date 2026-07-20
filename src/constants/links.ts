/**
 * 외부 링크 단일 소스.
 *
 * FEEDBACK_FORM_URL — 베타 테스터 피드백 Google Form 주소.
 * 폼을 만든 뒤 아래 상수에 URL 을 붙여넣으면 앱의 모든 "피드백 남기기" 진입점이
 * 그 폼으로 연결된다. 비어 있는 동안은 이메일(mailto) 폴백으로 동작한다.
 * 폼 만들기·권장 문항은 docs/beta-test.md 참고.
 */
export const FEEDBACK_FORM_URL = '';

const FEEDBACK_MAILTO =
  'mailto:junsangpark317@gmail.com?subject=' + encodeURIComponent('onion 피드백');

export function feedbackUrl(): string {
  return FEEDBACK_FORM_URL || FEEDBACK_MAILTO;
}
