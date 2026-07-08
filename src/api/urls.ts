/** 백엔드는 API 서버 없이 GitHub Pages 로 정적 JSON 을 서빙한다 (매시간 갱신). */
export const PRIMARY_BASE = 'https://jun317.github.io/onion_backend_v1.2/out';

/** Pages 장애 시 폴백 — 같은 파일이 main 브랜치에 커밋되어 있다. */
export const FALLBACK_BASE =
  'https://raw.githubusercontent.com/jun317/onion_backend_v1.2/main/out';

export const feedPath = () => '/index.json';
export const issuePath = (id: string) => `/issues/${id}.json`;
