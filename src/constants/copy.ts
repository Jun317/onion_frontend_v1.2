/**
 * UX 카피 단일 소스 — 화면에 뿌리는 한글 문구는 여기서만 관리한다.
 * 문체는 해요체 (redesignspec §2 확정).
 */
export const copy = {
  disclaimer: '본 콘텐츠는 투자 판단의 근거가 아닙니다.',

  // 피드
  freshnessOffline: '오프라인 — 저장된 소식이에요',
  freshnessUpdated: (rel: string) => `${rel} 업데이트`,
  freshnessSnapshot: (date: string) => `${date} 기준`,

  // 뷰어
  whyNow: '왜 중요할까요?',
  impactLine: '나에게는?',
  updatedAt: (rel: string) => `업데이트 ${rel}`,
  swipeToDetail: '옆으로 넘기면 자세한 내용',
  swipeToSummary: '옆으로 넘기면 요약으로',
  pagerPosition: (n: number, total: number) => `${n} / ${total} · 위로 넘기면 다음 이슈`,
  viewerHintLine: '↕ 위아래로 넘기면 다음 이슈',
  viewerHintDismiss: '탭해서 시작하기',

  // 더 알아보기 시트 섹션 (v4: 흐름·기사·같이보면·숫자로 보면 제거)
  sectionDetails: '무슨 일이에요?',
  sectionEffects: '그래서 어떻게 되나요?',
  sectionTips: '알아두면 좋아요',
  sectionVisuals: '자세한 데이터로 보면',

  // 기간 칩 (v4)
  tierWeekly: '이번 주',
  tierMonthly: '1개월',
  tierYearly: '연간',

  // 스테디
  steadySubtitle: '계속 지켜봐야 할 이슈예요',
  steadyEmptyTitle: '준비 중이에요',
  steadyEmptySubtitle: '오래 두고 볼 큰 이슈들을 모으고 있어요.\n다음 업데이트에서 만나요!',
  // 스테디 6블록 (v4)
  steadyScore: '지금 스코어',
  steadyStory: '지금까지 줄거리',
  steadyTimeline: '타임라인',
  steadyImpact: '나에게 미치는 영향',
  steadyNextUp: '다음 화 예고 — 이 뉴스가 뜨면 다음 화예요',
  steadyVisuals: '연결 시각자료',

  // 용어 사전 · 단어장
  wordSave: '📔 내 단어장에 저장',
  wordSaved: '✓ 단어장에 있어요',

  // 마이
  myInterests: '관심 분야',
  myInterestsHint: '고른 분야가 피드 카테고리 칩 앞쪽에 와요',
  myReadIssues: (n: number) => `읽은 이슈 ${n}`,
  myReadEmpty: '아직 읽은 이슈가 없어요',
  myWords: (n: number) => `내 단어장 ${n}`,
  myWordsEmpty: '용어 해설에서 저장한 단어가 여기 모여요',

  // 베타 피드백
  feedback: '피드백 남기기',
  feedbackHint: '1분이면 돼요 — 의견이 onion을 만들어요',

  // 출석 · 리텐션
  streakTitle: (n: number) => (n > 0 ? `🔥 ${n}일 연속 출석 중` : '오늘부터 출석을 시작해 보세요'),
  streakHint: (goal: number) => `하루 ${goal}개 이슈를 읽으면 출석이 이어져요`,
  todayProgress: (n: number, remain: number) =>
    remain > 0 ? `오늘 ${n}개 읽음 · 출석까지 ${remain}개` : `오늘 출석 완료 🔥`,

  // 상태
  errorTitle: '불러오지 못했어요',
  errorSubtitle: '인터넷 연결을 확인하고 다시 시도해 주세요',
  retry: '다시 시도',
  detailError: '자세한 내용을 불러오지 못했어요',
  detailLoading: '자세한 내용을 가져오고 있어요',
  invalidLinkTitle: '열 수 없는 링크예요',
  invalidLinkBody: '원문 주소가 유효하지 않아요.',
} as const;
