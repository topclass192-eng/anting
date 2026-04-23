# 앤팅(Anting) API 설계 명세서

## 개요
이 문서는 Phase 1 기간 동안 구현될 주요 Firebase Callable 기능들의 엔드포인트 명세를 정의합니다. 모든 API는 Firebase Cloud Functions 내에서 HTTPS Callable로 동작합니다. 항상 `try-catch`를 통해 공용 오류를 처리하며(반환값 `{ error: true, code, message }`), 모든 에러 메시지는 한국어로 출력됩니다.

---

## 1. Auth & Users
### 1.1 `setRole`
- **경로 / 메서드:** callable `setRole`
- **설명:** 현재 회원가입한 사용자(Authentication UID 기반)의 계정 유형(role)을 설정 또는 갱신합니다.
- **Request Format:**
  ```json
  {
    "role": "brand" // 또는 "influencer", "shopper", "admin"
  }
  ```
- **Response Format:**
  ```json
  {
    "success": true,
    "message": "역할이 성공적으로 설정되었습니다."
  }
  ```

---

## 2. Campaigns
### 2.1 `createCampaign`
- **경로 / 메서드:** callable `createCampaign`
- **설명:** 신규 캠페인을 등록합니다. (인증된 Brand Role 전용)
- **Request Format:** (ICampaign 참조, 자동 생성 필드 생략)
  ```json
  {
    "brandId": "xxx...",
    "title": "캠페인 제목",
    "description": "상세 가이드 등",
    "productName": "홍보상품 이름",
    "budget": 500000 
  }
  ```
- **Response Format:**
  ```json
  {
    "success": true,
    "data": { "id": "generatedObjectId" }
  }
  ```

### 2.2 `getCampaigns`
- **경로 / 메서드:** callable `getCampaigns`
- **설명:** 조건/분류에 따라 캠페인 목록을 페이징 처리하여 가져옵니다.
- **Request Format:**
  ```json
  {
    "limit": 10,
    "lastVisible": "documentID_or_cursor",
    "status": "active"
  }
  ```
- **Response Format:**
  ```json
  {
    "success": true,
    "data": [
      { /* ICampaign Object */ }
    ]
  }
  ```

### 2.3 `updateStatus`
- **경로 / 메서드:** callable `updateStatus`
- **설명:** 캠페인의 상태(`draft`, `active`, `closed`, `completed`)를 변경합니다.
- **Request Format:**
  ```json
  {
    "campaignId": "xxx...",
    "status": "closed"
  }
  ```
- **Response Format:**
  ```json
  {
    "success": true
  }
  ```

---

## 3. Applications
### 3.1 `apply`
- **경로 / 메서드:** callable `apply`
- **설명:** 인플루언서가 활성화된 캠페인에 지원서를 제출합니다.
- **Request Format:**
  ```json
  {
    "campaignId": "xxx...",
    "message": "본문 내용..."
  }
  ```
- **Response Format:**
  ```json
  {
    "success": true
  }
  ```

### 3.2 `select`
- **경로 / 메서드:** callable `select`
- **설명:** 캠페인에 접수한 지원서의 채택/거절 상태를 결정합니다.
- **Request Format:**
  ```json
  {
    "applicationId": "yyy...",
    "status": "selected" // 또는 "rejected"
  }
  ```
- **Response Format:**
  ```json
  {
    "success": true
  }
  ```
