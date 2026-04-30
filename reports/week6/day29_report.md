# Day 29: E2E 테스트 & 버그 픽스 보고서

## 1. 개요
- **목적**: 앤팅(Anting) 전체 시스템에 대한 End-to-End 시나리오 검증 및 Firestore 보안 규칙(Security Rules) 취약점 점검을 통해 서비스 안정성과 품질 확보.
- **수행 내역**:
  - 브랜드 및 인플루언서 전체 E2E 플로우 정상 동작 확인
  - 보안 시나리오 테스트 및 Security Rules 취약점 보완
  - 발견된 버그 리스트업 및 당일(P0/P1) 조치 완료

## 2. E2E 테스트 수행 결과

### 시나리오 A — 브랜드 전체 플로우 (✅ PASS)
- **과정**: 로그인 → 브랜드 프로필 등록 → 상품 등록 → 캠페인 등록 → 인플루언서 신청 수락(선발) → 운송장 등록 → 콘텐츠 검토 및 승인 처리
- **결과**: `testWeek5E2E.ts` 스크립트를 통한 통합 검증 시 트랜잭션 오류 없이 모든 스테이터스(`status`, `contentStatus`)가 순차적으로 정상 업데이트 됨을 재차 확인했습니다.

### 시나리오 B — 인플루언서 전체 플로우 (✅ PASS)
- **과정**: 로그인 → 인플루언서 프로필 등록 → 캠페인 검색 및 지원 → 배송 확인(수령 확인) → 콘텐츠 URL 제출 → 브랜드 승인 대기
- **결과**: 인플루언서 관점에서의 애플리케이션 생성부터 수익화 대시보드 반영까지의 데이터 흐름이 정상적으로 동작함을 확인했습니다.

### 시나리오 C — 보안 테스트 (✅ FIXED)
- **타 브랜드 캠페인 수정 시도**: Firestore 규칙의 `update` 권한 검증에 의해 정상적으로 거부(`Permission Denied`) 됨.
- **인플루언서 권한으로 캠페인 생성 시도**: Role 기반 검증(`isRole("brand")`)에 의해 접근이 완벽히 차단됨.
- **문서 소유권 임의 변경 테스트**: **[취약점 발견 및 조치]** Update 권한 시 `brandId`나 `influencerId`를 악의적으로 수정하는 것을 방지하기 위해 `request.resource.data.brandId == request.auth.uid` 구문을 룰에 추가하여 보완 완료.

## 3. 발견된 버그 및 조치 내역

| 버그 번호 | 내용 | 심각도 | 수정 여부 | 조치 내용 |
| :---: | :--- | :---: | :---: | :--- |
| **BUG-001** | 인플루언서 대시보드 - 쿼리 필드 오기입 (`userId` → `influencerId`) | P0 | ✅ 수정 완료 | `Dashboard.tsx` 파일 내 `applications` 컬렉션 쿼리 시, `where('influencerId', '==', user.uid)`로 올바르게 수정하여 목록이 비어보이는 증상 해결. |
| **BUG-002** | 브랜드 대시보드 - 권한 부족(Permission Denied) 에러 | P0 | ✅ 수정 완료 | `applications` 컬렉션 접근 시 규칙에서 `get(...)`을 통한 조회를 허용했으나, 클라이언트에서 `where('brandId', '==', user.uid)` 쿼리 시 정적 권한 검사가 실패하는 문제를 해결. `rules`에 `resource.data.brandId == request.auth.uid` 조건 추가. |
| **BUG-003** | 권한 악용 소유권(Owner) 변경 취약점 | P1 | ✅ 수정 완료 | `campaigns`, `products`, `applications` 문서 업데이트 시 기존 소유권자가 악의적으로 타인의 UID로 ID 필드를 변경할 수 있는 허점을 차단(`request.resource.data.id == request.auth.uid` 조건 강제). |
| **BUG-004** | 부분 업데이트 시 Timestamp 런타임 캐스팅 오류 | P2 | ✅ 수정 완료 | 기존 Day 25에서 조치된 건으로, `FieldValue.serverTimestamp()` 대신 `ISOString` 기반으로 일괄 처리하여 에뮬레이터 간 호환성 문제 방지. |

## 4. 최종 결과 및 향후 계획
- Firestore 규칙이 더욱 견고해졌으며, 프로덕션 배포 시 발생할 수 있었던 심각한 데이터 읽기/쓰기 오류(BUG-001, BUG-002)를 사전에 차단했습니다.
- 모든 플로우가 성공적으로 구동됨을 확인했으므로, **최종 프로덕션 환경(Firebase Hosting 및 GCP)으로의 배포(Day 30)**를 진행할 준비가 완료되었습니다.
