# Week 1 주간 보고서
> 주차: Week 1 | 단계: Phase 1 — 기반 설계 & MVP 코어

## 1. 이번 주 목표 달성 현황

### 달성률: 100%

### 주요 완료 작업
- **프로젝트 공통 규칙 수립:** `rules.md` 가이드라인 정의 및 적용
- **Firebase / GCP 연동:** `anting-app` 프로젝트 생성, `Firestore`, `Authentication`, `Hosting`, `Storage` 등 인프라 파이프라인 구성.
- **GitHub 기반 리포지토리 구성:** 프론트엔드(`apps/web`) 및 백엔드(`functions`) 분리.
- **데이터 모델링 전략 수립:** 인터페이스 `types` 병합 선언 (User, Brand, Influencer, Campaign 구조 확립) 및 ERD 명세 작성 완료.
- **Cloud Functions 아키텍처 스캐폴딩:** 인증 관리 및 API 엔드포인트 명세 선언.
- **CI/CD 파이프라인 안착:** 스테이징 및 프로덕션 자동 배포를 위한 `GitHub Actions` 연동 완료.

---

## 2. 발생한 주요 이슈 및 해결 방안

1. **배포 환경 초기 에러 (P1 오류)**
   - 원인: Firebase GCP 상에서 Hosting 리소스가 사전에 초기화되지 않아 Actions의 Site ID 결정 시 오류 발생.
   - 조치: Firebase 콘솔을 통한 사전 활성화 및 `.firebaserc`, `firebase.json` 구조적 매칭으로 정상 배포 루트 확인 및 복구 완료.

2. **Typescript 인코딩 및 스크립팅 위배사항 조기발見**
   - 원인: Placeholder 함수 구현 중 `any` 타입 명시, 미사용 변수 컴파일 통과 불가 `tsconfig.json` 위반, 윈도우 한글 인코딩 깨짐.
   - 조치: `unknown` 캐스팅, 린트/컴파일 오류 디버깅 완료 및 전체 프로젝트 파일 `UTF-8` 정규화 적용. 

---

## 3. 다음 주 계획 (Week 2)
1. 프론트엔드 React 상태 체계 (Context & Auth) 및 폴더 구조 강화
2. Firebase Authentication 연동 - 쇼퍼, 인플루언서, 브랜드 회원가입 로직 연결 개발 
3. PWA (Progressive Web Application) 기초 환경 구성 및 매니페스트 배포

---

## 4. 특이사항 건의
- 기초 설계가 매우 견고하며, 요구사항 분석이 명확하여 다음 주차 기능 개발 간 가속이 붙을 것으로 예상됩니다. MVP 구조를 맞추어 Auth UI부터 작업할 수 있는 환경이 조성되었습니다.
