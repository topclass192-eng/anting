# Day 2 작업 보고서
> 날짜: 2026-04-23 | Week 1 | Phase 1

## 1. 오늘의 작업 목표
- [x] TypeScript 인터페이스 파일 생성 (Frontend/Backend 공유)
- [x] ERD 다이어그램 문서화
- [x] Firestore 컬렉션 초기화 스크립트 준비

## 2. 완료된 작업
### 2-1. 공용 데이터 모델 및 ERD 설계
- 구현 내용: 사용자(IUser, IBrand, IInfluencer), 캠페인(ICampaign, IApplication), 쇼핑/포인트(IProduct, IOrder, IPoint), 알림(INotification)의 인터페이스 설계 및 Mermaid 기반 ERD 구축
- 주요 파일: `apps/web/src/types/index.ts`, `functions/src/types/index.ts`, `docs/erd.md`
- 관련 커밋: 

### 2-2. Firestore 초기화 스크립트
- 구현 내용: 프로젝트 초기 환경에서 Firestore 구조를 파악할 수 있도록 컬렉션 초기화 구조 및 단일/복합 인덱스 가이드 주석이 포함된 스크립트 작성
- 주요 파일: `scripts/initFirestore.ts`
- 관련 커밋: 

## 3. 발생한 오류 및 수정 내역
현재까지 발생한 주요 오류 없음.

## 4. 미완료 작업 및 사유
- 미완료 항목: 없음
- 사유: 계획된 설계 항목 모두 마무리됨.

## 5. 내일 작업 계획
- [ ] Firebase Authentication(카카오/네이버/이메일) 초기 연동
- [ ] React 기반 PWA 셸(앱 컨테이너) 구조 설계 작업

## 6. 특이사항 및 건의
- 없음
