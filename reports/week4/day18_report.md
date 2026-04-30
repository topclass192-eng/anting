# Phase 1 Week 4 Day 18 - 캠페인 탐색 화면 및 백엔드 페이지네이션 구현 보고서

## 개요
인플루언서 사용자가 앤팅(Anting) 플랫폼에 등록된 캠페인들을 탐색하고, 조건에 맞게 필터링할 수 있는 **캠페인 탐색 뷰(CampaignList.tsx)**와 이를 뒷받침하는 **백엔드 검색 쿼리(`getCampaigns.ts`)**를 성공적으로 구축했습니다. 특히 많은 양의 데이터를 효율적으로 로딩하기 위해 Firestore 커서 기반의 무한 스크롤 방식을 도입했습니다.

## 주요 구현 사항

### 1. 백엔드 (Cloud Functions: `getCampaigns.ts`)
- **필터링 조건 적용**: 프론트엔드로부터 `category`, `region`, `platform`을 받아 `where` 절로 동적 쿼리를 조립합니다. 기본적으로 `status === 'active'`인 모집중인 캠페인만 조회되도록 안전망을 구성했습니다.
- **최신순 정렬**: `orderBy('createdAt', 'desc')`를 사용하여 가장 최근에 생성된 캠페인이 상단에 오도록 했습니다. *(참고: 여러 where와 orderBy를 섞어 쓸 경우 Firestore의 복합 인덱스(Composite Index)가 필요할 수 있습니다.)*
- **페이지네이션(Pagination)**: 
  - `limit(pageSize)` (기본 10개) 적용
  - 이전 응답의 마지막 문서 ID를 `lastVisibleId`로 전달받아 `startAfter(doc)`를 통해 이어서 조회하도록 처리.
  - 다음 페이지가 존재하는지 여부를 판단하기 위해 `hasMore` 플래그를 반환합니다.

### 2. 프론트엔드 (Apps/Web: `CampaignList.tsx`)
- **상단 검색 & 탭 네비게이션**: 
  - 캠페인명, 브랜드명 등의 키워드 검색용 Search Bar 제공.
  - 카테고리를 직관적으로 선택할 수 있는 수평 스크롤 형태의 탭(전체, 뷰티, 식품 등) 구성.
- **상세 필터 드롭다운**: 지역(Region) 및 플랫폼(Platform)을 선택할 수 있는 Select UI 배치.
- **캠페인 카드 UI**: 
  - 제품 썸네일(없을 경우 기본 아이콘 표출), 모집 마감 임박 시 "마감임박" 뱃지 노출.
  - 플랫폼 아이콘 매핑(인스타그램, 블로그 등 아이콘 표시)과 D-Day 계산 로직 추가.
  - 현재 신청자/목표 인원 대비 진행 비율(초과 시 색상 변경) 시각적 표시.
- **무한 스크롤(Infinite Scroll)**:
  - `IntersectionObserver` 훅을 활용하여 스크롤이 하단 마지막 카드 요소에 도달했을 때 중복 호출 없이 부드럽게 다음 데이터를 페칭(`fetchCampaigns(true)`)하도록 연동 완료.

### 3. 라우팅
- `App.tsx` 내에 인플루언서 권한만 접근할 수 있는 `/influencer/campaigns` 라우트(`CampaignList` 컴포넌트)를 `ProtectedRoute`로 감싸 등록했습니다.

## 달성된 목표
- [x] Firestore 쿼리에 복합 필터(상태, 카테고리, 지역, 플랫폼) 적용
- [x] Cursor (`startAfter`) 기반 페이지네이션 구축
- [x] 세련된 카드 UI와 검색/탭/필터 컨트롤이 통합된 뷰 구현
- [x] 부드러운 UX를 위한 Intersection Observer 활용 무한 스크롤

## 다음 단계
- 실제 데이터(Mock 또는 개발 DB)를 활용해 Firestore 복합 인덱스 요구 에러가 발생하는지 콘솔을 점검하고, 에러 콘솔의 URL을 클릭해 사전 인덱스를 생성해야 할 수 있습니다.
- 특정 캠페인 카드 클릭 시 진입하는 **캠페인 상세 보기 (CampaignDetail)** 및 **지원 신청(Apply)** 프로세스 구현으로 자연스럽게 이어집니다.
