# Phase 1 Week 2 Day 8 Report

## 1. 카카오 소셜 로그인 기반 마련
카카오 개발자센터 앱에 등록될 REST API Key와 리다이렉트 URI 정보를 환경 변수 (`.env.development`, `.env.staging`)에 안전하게 저장하여 구성했습니다.

## 2. 백엔드 카카오 OAuth 모듈 구현
`functions/src/auth/kakaoAuth.ts` 파일을 작성하여 다음 3가지 핵심 백엔드 통신 로직을 구현했습니다:
- **`getKakaoToken`**: 전달된 Authorization Code를 이용해 카카오 OAuth 서버와 통신하여 엑세스 토큰(Access Token) 발급
- **`getKakaoUser`**: 발급된 엑세스 토큰을 기반으로 사용자 정보 요청 시도
- **`createFirebaseToken`**: 카카오 계정이 없는 사용자를 위한 자동 이메일 `kakao_{id}@anting.app` 포맷팅과 더불어 Firebase Admin SDK를 사용해 커스텀 토큰(Custom Token)을 생성하고, `isNewUser` 플래그를 통해 신규 여부 반환

*(자동 에뮬레이터 검증을 위해 `FUNCTIONS_EMULATOR=true` 환경일 때 Mock 응답을 주도록 코드 경로를 별도로 구성하였습니다.)*

## 3. Cloud Function (/api/auth/kakao) API 엔드포인트 구성
Express `app`을 활용하여 백엔드 REST API를 `functions/src/auth/index.ts` 에 구성하였습니다. Frontend로부터 코드를 받아 토큰을 발급하는 프로세스를 하나의 엔드포인트로 노출시켰습니다. 

## 4. 프론트엔드 React 통합 모듈 구현
`apps/web/src/components/auth/KakaoLoginButton.tsx` 컴포넌트를 구현하였습니다:
- 카카오의 권한 부여 서버(Authorization Endpoint)로 자동 리다이렉트할 수 있도록 로그인 버튼 구성.
- 쿼리스트링 `?code=...`가 감지되면 백엔드 API (POST `/api/auth/kakao`)에 자동 요청하여 Firebase Custom Token 획득 로직 구현.
- 로딩 중이거나 에러가 일어났을 때의 적절한 한국어 응답 피드백 처리.

## 5. 전체 플로우 자동화 테스트 결과
Firebase Emulator 상에서 Mock Flow 자동화 테스트 스크립트(`scripts/testKakaoLogin.ts`)를 작성하고 실행한 결과 **모든 과정(로그인 -> 신규 유저 생성 -> 커스텀 토큰 연결 -> DB 문서 반영)이 문제없이 통과**하였습니다. 

```
--- Firebase Kakao OAuth 전체 플로우 테스트 시작 ---
1. Cloud Function 엔드포인트(/api/auth/kakao)에 MOCK_CODE 전송...
✅ 응답 성공: firebaseToken 이 반환됨 (isNewUser: true)

2. signInWithCustomToken 로그인 테스트...
✅ Custom Token 로그인 성공! User UID: kakao:88888888

3. users 컬렉션 문서 확인 대기중...
✅ users 문서 생성 확인됨
--- 카카오 로그인 플로우 테스트 완료 [ALL PASSED] ---
```
