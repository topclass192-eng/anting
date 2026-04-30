# Phase 1 Week 2 Day 7 Report

## 1. Firebase Auth 및 Custom Claims 설정 완료
Firebase Authentication 기본 이메일/비밀번호 로그인이 연동되었습니다. 
또한 `functions/src/auth/setRole.ts`에 `setUserRole` Callable Cloud Function을 구현하여, 클라이언트/서버에서 안전하게 사용자 역할(`brand`, `influencer`, `shopper`, `admin`)을 Firebase Custom Claims에 할당하고 Firestore의 users 컬렉션을 동기화하도록 구축했습니다.

## 2. Authentication 이벤트 트리거 구성 및 미들웨어
- **onUserCreate**: 새로운 회원이 가입할 때(`onUserCreate.ts`), Firestore `users/{uid}` 문서가 초기화되며 `role: null`과 `onboardingStep: 0` 등 초기 상태값들이 안전하게 부여됩니다.
- **Auth 미들웨어**: `utils/auth.ts`에 `verifyAuth()` 및 `verifyRole()` 헬퍼 함수들을 구현하여 권한 없음에 대한 오류(`permission-denied`, `unauthenticated`)를 한국어 에러 메시지(`'접근 권한이 없습니다.'`, `'인증이 필요합니다.'`)로 반환하도록 하였습니다.

## 3. 프론트엔드 로그인 페이지 구현
`apps/web/src/pages/Login.tsx` 경로에 이메일 및 비밀번호 검증과 로그인 처리가 포함된 UI 컴포넌트를 작성했습니다. 올바르지 않은 자격 증명 등에 대해 예외 처리 로직으로 사용자(UI)에 한국어 피드백을 전달하도록 구현되었습니다.

## 4. Emulator 통합 플로우 테스트
Firestore, Functions, Auth 에뮬레이터 환경을 구동한 후 위 구현을 아래 시나리오대로 검증(`testAuthFlow.ts`)하였고, 모두 **성공(통과)** 하였습니다.
1. 이메일 기반 임시 회원가입 실행 (성공)
2. `onUserCreate` 백그라운드 이벤트 트리거 및 `users` 컬렉션 기본 문서 자동 생성 확인 (성공)
3. `setUserRole` Callable 함수를 호출하여 권한('influencer') 할당 및 Custom Claims 갱신 대기 (성공)
4. 토큰을 Re-fetch하여 실제 Custom Claims 페이로드 내에 `role: influencer` 매핑 확인 (성공)
