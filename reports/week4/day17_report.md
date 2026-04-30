# Phase 1 Week 4 Day 17 - Instagram API 연동 구현 보고서

## 개요
인플루언서 사용자가 자신의 프로필에 인스타그램 계정을 자동으로 연동하여 프로필 정보 및 영향력(게시물 수, 팔로워 수 등)을 가져올 수 있도록 **Instagram Basic Display API** 연동 구조를 백엔드(Cloud Functions)에 구현했습니다. 또한 API 에러나 권한 부족 시 수동 입력으로 부드럽게 전환되는 **폴백(Fallback) 구조**를 함께 구성했습니다.

## 주요 구현 사항

### 1. Instagram API 유틸리티 개발 (`instagramAuth.ts`)
- **`getInstagramAuthUrl()`**: 
  - 인스타그램 사용자가 로그인 및 권한 부여를 진행할 수 있도록 OAuth 2.0 인증 진입점 URL을 동적으로 생성합니다.
- **`getInstagramToken(code)`**: 
  - 클라이언트가 콜백으로 넘겨준 인증 코드(`code`)를 인스타그램 서버에 전송하여 짧은 수명 혹은 장기 `access_token`으로 교환합니다.
- **`getInstagramUser(token)`**: 
  - 발급받은 `access_token`을 사용해 인스타그램 Graph API(`https://graph.instagram.com/me`)를 호출하여 사용자의 계정 기본 정보를 조회합니다.

### 2. Express 라우터 엔드포인트 연동 (`auth/index.ts`)
- **`GET /api/auth/instagram/url`**:
  - 프론트엔드가 인스타그램 로그인 버튼 클릭 시 호출하며, 사용자를 리다이렉트할 OAuth URL을 반환합니다.
- **`POST /api/auth/instagram/connect`**:
  - 인가 코드를 전달받아 백엔드에서 토큰 교환 및 유저 조회를 일괄 수행합니다.
  - 성공적으로 데이터가 수집되면 Firestore의 `influencers/{uid}` 문서 내 `sns.instagram` 경로에 계정 정보를 업데이트합니다.

### 3. 강건한 폴백(Fallback) 및 에러 핸들링
> **기술적 한계점 처리**: Instagram Basic Display API는 스펙상 `follower_count`를 제공하지 않습니다 (오직 Graph API를 사용하는 비즈니스/크리에이터 계정만 조회 가능).
- 본 기능에서는 사용자가 요구하는 "팔로워 수"를 가져오지 못하는 API 한계 상황이나 네트워크/인증 에러 상황을 의도적으로 감지합니다.
- 문제가 감지되면 프론트엔드로 `400 Bad Request`와 함께 **"인스타그램 연동에 실패했습니다. 팔로워 수를 직접 입력해 주세요."** 라는 명확한 에러 메시지를 반환합니다. 
- 이를 통해 클라이언트 애플리케이션은 즉시 실패 상황을 인지하고 사용자에게 수동 입력 폼을 활성화하는 유연한 대처가 가능해집니다.

## 달성된 목표
- [x] Instagram OAuth 기반 인증/토큰 교환/유저 조회 로직 구현
- [x] Cloud Functions 내 API 엔드포인트 생성 (`/url`, `/connect`)
- [x] Firestore `influencers` 컬렉션 업데이트 연결
- [x] Basic Display API 한계를 고려한 "수동 입력 전환" 명시적 에러 메시지 처리

## 다음 단계
- 프론트엔드(`Profile.tsx` 등)에 인스타그램 연동 버튼을 부착하고, 실제로 팝업 기반 혹은 리다이렉트 기반 OAuth 플로우를 통합합니다.
- 에러 응답 시 인플루언서가 직접 팔로워 수를 입력하도록 프론트엔드 UI 상태를 전환하는 로직 테스트.
