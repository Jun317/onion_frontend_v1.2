/**
 * Pretendard 폰트 매핑 (OFL 라이선스, assets/fonts/ 번들).
 * RN(특히 Android)은 커스텀 폰트에서 fontWeight 합성을 지원하지 않으므로
 * 굵기마다 별도 fontFamily 를 등록하고 이 헬퍼로 매핑한다.
 */

export const fontSources = {
  'Pretendard-Regular': require('@/assets/fonts/Pretendard-Regular.otf'),
  'Pretendard-SemiBold': require('@/assets/fonts/Pretendard-SemiBold.otf'),
  'Pretendard-Bold': require('@/assets/fonts/Pretendard-Bold.otf'),
  'Pretendard-ExtraBold': require('@/assets/fonts/Pretendard-ExtraBold.otf'),
  'Pretendard-Black': require('@/assets/fonts/Pretendard-Black.otf'),
} as const;

export type FontWeight = 400 | 500 | 600 | 700 | 800 | 900;

const familyByWeight: Record<FontWeight, keyof typeof fontSources> = {
  400: 'Pretendard-Regular',
  500: 'Pretendard-SemiBold', // Medium 미번들 — 가장 가까운 굵기로
  600: 'Pretendard-SemiBold',
  700: 'Pretendard-Bold',
  800: 'Pretendard-ExtraBold',
  900: 'Pretendard-Black',
};

/** 스타일 스프레드용: `{ ...font(700), fontSize: 17 }` */
export function font(weight: FontWeight): { fontFamily: string } {
  return { fontFamily: familyByWeight[weight] };
}
