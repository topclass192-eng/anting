# Phase 1 Week 2 Day 9 Report

## 1. 공통 소셜 로그인 레이어 (ISocialAuthProvider) 추상화
두 가지의 각기 다른 소셜 제공자(Provider)를 통합하여 관리하기 위해 `functions/src/auth/socialAuth.ts`를 작성하였습니다. 이 파일에서 `getToken` 과 `getUserInfo`를 공통의 인터페이스로 포괄하였으며, 단일한 인증 흐름을 통해 백엔드의 유연성을 확보하였습니다.

## 2. 네이버 인증 흐름 (naverAuth) 구현
카카오의 구현 구조를 활용하여 `functions/src/auth/naverAuth.ts` 를 작성했습니다:
- 사용자의 인가 코드를 받아 Access Token으로 변환 (`getToken`)
- 엑세스 토큰 기반의 OpenAPI/Naver Profile 유저 정보 수급 (`getUserInfo`)
- API 호출 누락 및 비정상 접근 시 에러 반환 로직 구성

## 3. 계정 병합 및 동일 식별자 매핑 방식 검증
한 유저가 카카오와 네이버 두 개의 서로 다른 디바이스/소셜로 가입하더라도, 공통된 식별자 흐름에서 충돌을 방지하며 Firebase Custom Token 을 정상 발급할 수 있도록 `createFirebaseToken` 공통 메소드로 처리를 단순화하였습니다:
- Firebase는 중복 생성을 막고, 해당 소셜 Account ID 기반의 단일 UID (`provider:id`)를 Custom Token으로 발급 및 검증합니다.
- 동일 이메일 연동 관련하여 Firebase는 각각의 계정으로 독자 구분하지만, 어플리케이션은 내부적으로 이메일을 식별하여 병합된 이력을 추종할 수 있습니다. 

## 4. 프론트엔드 - CSRF 대비 State 파라미터 적용
`apps/web/src/components/auth/` 에 `KakaoLoginButton.tsx` 그리고 새롭게 구성된 `NaverLoginButton.tsx` 두 UI 컴포넌트에 난수(State) 발생 로직을 추가했습니다.
- 로그인 서버 접속 직전 `sessionStorage`에 렌덤 State Key를 보관
- 이후 Redirect된 `?state=xxx` 파라미터가 보관된 토큰과 **불일치**하면 비정상적 접근(CSRF 공격)으로 간주해 인증 프로세스를 중단하도록 구현했습니다.

## 5. 자동화 테스트 결과
`scripts/testSocialLogin.ts`를 통해 에뮬레이터 환경에서 두 시나리오를 통합 검증하였습니다:

| 테스트 시나리오 | 검증 내역 | 결과 (Pass/Fail) |
|---|---|:---:|
| **Scenario 1:** (Kakao 신규) | 카카오 Mock 코드로 `provider: kakao` CustomToken 획득 후 firestore `users` 새 문서 생성 확인 | 🟢 **PASS** |
| **Scenario 2:** (Naver 동일이메일 연동) | 네이버 Mock 코드로 `provider: naver` CustomToken 획득 후 토큰 파싱 확인. 기존 카카오 계정과 동일 이메일일 경우에도 안전하게 우회 식별 | 🟢 **PASS** |

전체 Firebase Emulation + Cloud Function + Firestore 간의 소셜 인증 루프를 모두 완료하였습니다.
