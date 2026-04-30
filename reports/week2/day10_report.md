# Phase 1 Week 2 Day 10 Report

## 1. 역할 선택 UI 및 연동
- React 기반의 `RoleSelect.tsx` 화면을 신규 개발하였습니다.
- 브랜드/인플루언서/쇼퍼 각 카드 폼에서 선택된 역할을 `setUserRole` Callable Cloud Function으로 동기화하여 Firestore DB 및 Custom Claims를 갱신합니다.
- 동기화 완료 시 즉시 각 스코프별 대시보드 화면들(`BrandDashboard`, `InfluencerDashboard`, `ShopHome`)로 자동 우회하도록 라우터 체계를 구축하였습니다.

## 2. 라우터 통제 체계 (Protected Route)
React Router v6 아키텍처 위에 `ProtectedRoute.tsx` 인증 컴포넌트를 이식하였습니다:
- Firebase 엑세스 상태(세션 여부)를 파악하고 미가입/로그아웃 접속자의 임의 접근 시도시 `/login` 으로 차단합니다.
- 접속은 되었으나 "role" 기반 온보딩이 진행되지 않은 유저는 다른 어떠한 하위 대시보드도 접속을 거부하고 무조건 `/role-select` 창으로 리다이렉트합니다.
- 권한이 설정된 유저는 정상적인 분기로 접속시키며, Role 일치 조건을 판별합니다.

## 3. 인증 시스템 전체 E2E 테스트 검증 성공
에뮬레이터 위에서 `scripts/testE2EAuthFlow.ts` 파일로 통합 검증을 진행했습니다.

| 테스트 상황 | 시나리오 절차 | 결과 |
|---|---|:---:|
| **Scenario 1** | 에뮬레이터 카카오 로그인 성공 후 `setUserRole(brand)` 호출. Custom Claims 검증 통과 | 🟢 **PASS** |
| **Scenario 2** | 에뮬레이터 네이버 로그인 성공 후 `setUserRole(influencer)` 호출. Custom Claims 검증 통과 | 🟢 **PASS** |
| **Scenario 3** | 이메일 기반 회원가입 후 `setUserRole(shopper)` 호출. Custom Claims 검증 및 트리거 동작 | 🟢 **PASS** |
| **Scenario 4** | 최종 로그아웃 직후 보안 권한이 필요한 Firebase 환경 스코프 도달시 접근 거부 블로킹 확인 | 🟢 **PASS** |
