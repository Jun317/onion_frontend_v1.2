# 어니언 (onion_frontend_v1.2)

경제 뉴스를 **쉽고, 간결하고, 직관적으로** 전달하는 뉴스 종합 앱.
[onion_backend_v1.2](https://github.com/jun317/onion_backend_v1.2)가 이슈 단위로 재구성한 뉴스 데이터를 가져와 보여주는 Expo(React Native) 앱입니다.

## 데이터가 오는 곳

백엔드는 API 서버가 아니라 **GitHub Pages 정적 JSON**입니다 (GitHub Actions가 매시간 갱신).

| 용도 | URL |
|---|---|
| 이슈 피드 | `https://jun317.github.io/onion_backend_v1.2/out/index.json` |
| 이슈 상세 | `https://jun317.github.io/onion_backend_v1.2/out/issues/{id}.json` |
| 폴백 | `https://raw.githubusercontent.com/jun317/onion_backend_v1.2/main/out/…` |

앱은 Pages → 실패 시 raw 순서로 시도하고, 받은 데이터는 기기에 캐시해 오프라인에서도 마지막 소식을 보여줍니다.

## 화면 구성

- **이슈 탭** — 이슈 카드 리스트. 정렬은 파급도순 / 최신순 2가지. 당겨서 새로고침.
- **이슈 뷰어** — 카드를 탭하면 풀스크린으로:
  - **위/아래 스와이프** = 이전/다음 이슈 (숏폼처럼 한 화면에 한 이슈)
  - **옆으로 스와이프** = "더보기" — 쉬운 설명, 나에게 미치는 영향, 공식 수치(FRED·ECOS·DART), 지금까지 흐름, 원문 기사, 관련 이슈
  - 파란 용어를 탭하면 **쉬운 해설 시트**가 올라옵니다
- **스테디 이슈 탭** — 장기 팔로우 이슈 (준비 중)

## 실행하기 (Expo 처음이어도 OK)

### 처음 한 번만

1. **Node.js 설치** — [nodejs.org](https://nodejs.org)에서 LTS 버전 다운로드 후 기본값으로 설치. 터미널에서 `node -v`가 v20 이상이면 성공.
2. **폰에 Expo Go 설치** — App Store / Play Store에서 "Expo Go" 검색 (무료).

### 앱 켜기

```bash
git clone https://github.com/jun317/onion_frontend_v1.2.git
cd onion_frontend_v1.2
npm install        # 처음 한 번, 몇 분 걸려요
npx expo start
```

터미널에 QR 코드가 뜨면 (⚠️ **컴퓨터와 폰이 같은 Wi-Fi**에 있어야 해요):

- **iPhone**: 기본 카메라 앱으로 QR을 비추고 "Expo Go에서 열기" 탭
- **Android**: Expo Go 앱을 열고 "Scan QR code"

코드를 고치면 폰 화면이 자동으로 새로고침됩니다. 화면이 이상하면 폰을 흔들어 메뉴에서 **Reload**.

### 잘 안 될 때

| 증상 | 해결 |
|---|---|
| QR을 찍어도 연결이 안 됨 (회사/공용 Wi-Fi 등) | `Ctrl+C`로 끄고 `npx expo start --tunnel` (처음에 설치 질문이 나오면 `y`) |
| "SDK version mismatch" | 폰의 Expo Go 앱을 스토어에서 업데이트 |
| 데이터가 안 뜸 | 백엔드 GitHub Pages가 살아있는지 확인: 브라우저에서 위 피드 URL 열어보기 |

## 검증 스크립트 (기기 없이)

```bash
npx tsc --noEmit                                      # 타입 체크
node --experimental-strip-types scripts/check-data.ts  # 실제 백엔드 데이터 스키마 검증
node --experimental-strip-types scripts/check-logic.ts # 차트 수학·글로서리 파서 테스트
npx expo export --platform web                          # 번들 확인
```

## 프로젝트 구조

```
src/app/                # 라우트 (Expo Router)
  (tabs)/index.tsx      #   이슈 리스트 탭
  (tabs)/steady.tsx     #   스테디 이슈 탭 (준비 중)
  issue/[id].tsx        #   풀스크린 이슈 뷰어
src/api/                # fetch 클라이언트 (기본 URL + 폴백 + 타임아웃)
src/data/               # 타입·캐시·정규화·정렬·훅 (useFeed / useIssue)
src/components/
  feed/                 #   카드·정렬 토글·신선도 표시
  viewer/               #   세로 페이저·히어로·더보기 페인
  detail/               #   상세 섹션 6종
  charts/               #   SVG 계단/꺾은선/그룹 막대 (chartMath 순수함수)
  glossary/             #   용어 하이라이트 + 해설 시트
src/theme/              # 라이트/다크 팔레트 + 카테고리 8색
```

설계 원칙: 화면당 선택 요소 최소화, 해요체 UX 라이팅, 커스텀 네이티브 모듈 없음(**Expo Go에서 바로 실행 가능**).

## 나중에: 설치형 앱 만들기 (요약)

1. [expo.dev](https://expo.dev) 무료 계정 → `npm i -g eas-cli` → `eas login`
2. `eas build:configure`
3. **Android APK**: `eas build -p android --profile preview` → 빌드 완료 링크에서 APK 받아 폰에 설치
4. **iOS**: 설치형 배포는 Apple Developer($99/년)가 필요해요. 당분간은 Expo Go로 충분합니다.

## 알려진 제한

- 스와이프 감도·페이징 스냅은 웹 시뮬레이션으로 검증했으므로 **실기기(Expo Go)에서 한 번 확인**하는 것을 권장해요.
- "도움이 돼요" 투표·조회수 정렬은 백엔드에 사용자 데이터 저장소가 없어 이번 버전에서 제외했어요.
- 뉴스 데이터 출처: GDELT · FRED · 한국은행 ECOS · DART · SEC EDGAR. **본 콘텐츠는 투자 판단의 근거가 아닙니다.**
