/****************************************
 *
 * GA4 관리자 대시보드 설정
 *
 * 전부 공개 값이다. OAuth 클라이언트 ID는 브라우저에 노출되도록 만들어진 값이고,
 * 속성 ID만으로는 데이터를 읽을 수 없다 — 읽기 권한은 로그인한 계정의 GA4 권한이 정한다.
 * 그래서 환경변수로 받지 않는다. 빌드가 환경변수 없이 도는 원칙을 지킨다.
 *
 ****************************************/

export const GA4_PROPERTY_ID = "433431799";

export const OAUTH_CLIENT_ID =
  "131871495844-jjum07lvadb8iju1t8093s8kaca1udht.apps.googleusercontent.com";

/** GA4 읽기 + Search Console 읽기. GIS는 공백으로 구분한 여러 범위를 받는다. */
export const OAUTH_SCOPE = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
].join(" ");

/** 고를 수 있는 기간(일). */
export const PERIODS = [7, 28, 90] as const;

export type Period = (typeof PERIODS)[number];

export const DEFAULT_PERIOD: Period = 28;

/** Search Console의 도메인 속성. URL 접두어 속성이면 "https://iaman.kr/" 형태다. */
export const SEARCH_CONSOLE_SITE = "sc-domain:iaman.kr";
