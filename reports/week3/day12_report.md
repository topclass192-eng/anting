# Phase 1 Week 3 Day 12 - Product CRUD Implementation Report

## 개요
브랜드 사용자가 자신의 제품을 등록, 수정, 삭제(소프트 삭제), 조회할 수 있는 완전한 CRUD 시스템을 구현했습니다.

## 주요 구현 사항

### 1. 제품 등록 폼 (`ProductRegister.tsx`)
- 입력 폼 구성: 제품명, 카테고리, 제품 설명, 소비자가 입력 필드 구현.
- 다중 이미지 업로드: Day 11에 작성된 `ImageUpload` 공통 컴포넌트를 사용하여 최대 5장의 이미지를 드래그앤드롭으로 순서 변경할 수 있도록 적용했습니다.
- 동적 경로: 마운트 시 생성된 UUID(`productId`)를 활용하여 Firebase Storage(`products/{productId}/images/...`) 업로드 경로를 동적으로 생성합니다.

### 2. 제품 목록 페이지 및 컴포넌트 (`ProductList.tsx`, `ProductCard.tsx`)
- `ProductList.tsx`: 무한 스크롤(pagination) 형태로 구현된 제품 목록을 불러옵니다. 초기 로딩 및 빈 데이터 상태 처리를 포함하며, 제품 추가, 수정, 삭제 인터페이스와의 연결을 지원합니다.
- `ProductCard.tsx`: 리스트에 보여질 단일 제품 카드. 썸네일(첫 번째 이미지), 카테고리, 이름, 한화 가격 포맷팅을 지원하며 "수정"과 "삭제" 액션 콜백을 제공합니다.

### 3. 클라우드 함수 (`createProduct`, `getProducts`, `updateProduct`, `deleteProduct`)
- 보안 검증: 함수 호출자의 로그인 여부 및 역할(`role === 'brand'`)을 엄격히 검증.
- 유효성 검사: `validators.ts`의 `validateProductInput`을 통해 제품명(1~50자), 카테고리, 설명(1~500자), 소비자가(숫자), 이미지 개수(1~5장) 등을 서버 사이드에서 검증합니다.
- 데이터 조작: 
  - 생성/수정: 검증된 데이터를 `products` 컬렉션에 추가하거나 업데이트.
  - 삭제: 실제 데이터 삭제 대신 `status: 'deleted'`로 변경하는 소프트 삭제 전략 적용.
  - 조회: `status != 'deleted'` 조건으로 조회 및 무한 스크롤(limit/startAfter) 대응.

### 4. 기타
- `App.tsx`에 `/brand/products`, `/brand/products/new`, `/brand/products/:id/edit` 라우트를 추가했습니다.
- 클라우드 함수들은 `index.ts`에서 안전하게 내보내기(export) 처리되었습니다.

## 후속 작업
- 실 환경 테스트 진행
- 필요 시 ProductEdit 컴포넌트 데이터 페치 로직 고도화
