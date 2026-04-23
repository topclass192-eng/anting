> 앤팅(Anting) Phase 1 — 프로젝트 개발 규칙
> 작성일: 2026-04-23 | 버전: v1.0.0

---

## Section 1. 프로젝트 개요 및 기술 스택

### 1-1. 프로젝트 정보

| 항목 | 내용 |
|---|---|
| 프로젝트명 | 앤팅(Anting) — 나노인플루언서 원스톱 마케팅 플랫폼 |
| 현재 Phase | Phase 1 — 기반 설계 & MVP 코어 |
| 개발 기간 | 6주 (Week 1 ~ Week 6) |
| 개발 방식 | 1인 풀스택 (Claude Code + Google AI 툴 활용) |
| 개발 도구 | 안티그래비티(Antigravity) |
| 언어 | TypeScript (프론트엔드 + Cloud Functions) |
| 보고 언어 | 한국어 |

### 1-2. 기술 스택

Frontend     : Firebase Hosting + PWA (React + TypeScript)
Backend      : Cloud Run + Cloud Functions (Node.js/TypeScript)
Database     : Firestore (NoSQL)
Storage      : Firebase Storage + Google Cloud Storage (GCS)
Auth         : Firebase Authentication (카카오·네이버 소셜 + 이메일)
CI/CD        : GitHub Actions + Cloud Build
AI Tools     : Claude Code (개발) · Gemini Pro (기획 보조)
Monitoring   : Firebase Performance + Firebase Analytics

### 1-3. 환경 분리

development  : 로컬 개발 환경 (Firebase Emulator Suite)
staging      : 스테이징 환경 (dev 브랜치 → 자동 배포)
production   : 프로덕션 환경 (main 브랜치 → 수동 승인 후 배포)

### 1-4. 폴더 구조

anting/
├── rules.md
├── reports/
│   ├── week1/
│   │   ├── day1_report.md
│   │   └── ...
│   └── ...
├── apps/
│   └── web/
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── hooks/
│           ├── types/
│           └── utils/
├── functions/
│   └── src/
├── firestore.rules
├── storage.rules
├── firebase.json
├── .env.development
├── .env.staging
└── .env.production

---

## Section 2. 개발 규칙 및 컨벤션

### 2-1. 코딩 컨벤션

컴포넌트    : PascalCase          (예: CampaignCard.tsx)
함수/변수   : camelCase           (예: getCampaignList)
상수        : UPPER_SNAKE_CASE    (예: MAX_UPLOAD_SIZE)
파일명      : kebab-case          (예: campaign-card.tsx)
타입/인터페이스 : PascalCase + I 접두사 (예: ICampaign, IUser)

TypeScript 규칙:
- any 타입 절대 사용 금지
- 모든 날짜 필드는 Firestore Timestamp 타입 사용
- optional 필드는 ? 표시
- 파일 크기: 컴포넌트 최대 200줄, Cloud Functions 최대 150줄

### 2-2. Firestore 컬렉션 네이밍

users              : 사용자 기본 정보
brands             : 브랜드(광고주) 프로필
influencers        : 인플루언서 프로필
campaigns          : 캠페인 정보
applications       : 캠페인 신청 정보
contents           : 제출된 콘텐츠 정보
points             : 포인트 트랜잭션
notifications      : 알림 이력

보안 규칙 원칙:
- 모든 읽기/쓰기는 인증된 사용자만 허용
- 역할(role) 기반 접근 제어 필수
- 본인 데이터만 수정 가능 (어드민 제외)
- 규칙 변경 시 반드시 Emulator로 테스트 후 배포

### 2-3. Git 브랜치 전략

main           : 프로덕션 배포 브랜치 (직접 커밋 금지)
dev            : 스테이징 배포 브랜치
feature/xxx    : 기능 개발 브랜치
fix/xxx        : 버그 수정 브랜치

커밋 메시지 형식 (한국어):
feat    : 새 기능 추가
fix     : 버그 수정
docs    : 문서 수정
style   : 코드 포맷 변경
refactor: 코드 리팩토링
test    : 테스트 추가/수정
chore   : 빌드·설정 변경

예시:
feat: 캠페인 등록 폼 Step 1 기본 정보 입력 구현
fix: 카카오 로그인 후 역할 선택 화면 리다이렉트 오류 수정
docs: Week 1 Day 3 작업 보고서 추가

### 2-4. 환경 변수 관리

- .env 파일은 절대 Git에 커밋하지 않는다
- .gitignore에 .env.* 반드시 포함 (.env.example 제외)
- 모든 API 키는 GCP Secret Manager에 저장
- 로컬 개발 시에만 .env.development 사용

### 2-5. 오류 처리 규칙

- 모든 오류 메시지는 한국어로 작성
- try-catch 없는 async 함수 금지
- 오류 무시 (빈 catch 블록) 절대 금지

### 2-6. 오류 직접 수정 원칙

- 개발 중 발생한 모든 오류는 안티그래비티가 직접 수정한다
- 오류 수정 후 반드시 해당 Day 보고서에 기록한다
- 수정 불가 오류 발생 시 즉시 한국어로 보고하고 대안을 제시한다
- P0 오류 (서비스 불가): 즉시 수정 후 보고
- P1 오류 (기능 일부 불가): 당일 내 수정 후 보고
- P2 오류 (UI·경미한 버그): 해당 주 내 수정 후 보고

---

## Section 3. 작업 보고 규칙

### 3-1. 보고서 작성 원칙

- 모든 보고는 한국어로 작성한다
- 작업 완료 후 반드시 reports/weekN/dayN_report.md 파일을 생성하여 저장한다
- 보고서는 당일 작업 종료 전 저장 완료한다

### 3-2. 일일 보고서 템플릿

# Day N 작업 보고서
> 날짜: YYYY-MM-DD | Week N | Phase 1

## 1. 오늘의 작업 목표
- [ ] 작업 목표 1
- [ ] 작업 목표 2

## 2. 완료된 작업
### 2-1. [작업명]
- 구현 내용:
- 주요 파일:
- 관련 커밋:

## 3. 발생한 오류 및 수정 내역
### 오류 1
- 오류 내용:
- 오류 원인:
- 수정 방법:
- 수정 파일:
- 심각도: P0 / P1 / P2

## 4. 미완료 작업 및 사유
- 미완료 항목:
- 사유:

## 5. 내일 작업 계획
- [ ] 내일 할 작업 1

## 6. 특이사항 및 건의

### 3-3. 주간 보고서 템플릿

매주 금요일 reports/weekN/weekly_report.md 파일로 저장

# Week N 주간 보고서
> 기간: YYYY-MM-DD ~ YYYY-MM-DD | Phase 1

## 1. 이번 주 목표 달성 현황
| 목표 | 달성 여부 | 비고 |
|---|---|---|

달성률: N / N (N%)

## 2. 주요 구현 내용 요약

## 3. 이번 주 발생한 주요 오류 요약
| 오류 | 원인 | 해결 방법 | 심각도 |

## 4. 다음 주 작업 계획

## 5. 리스크 및 건의사항

### 3-4. 보고서 디렉토리 구조

reports/
├── week1/
│   ├── day1_report.md ~ day5_report.md
│   └── weekly_report.md
├── week2/ ~ week5/
└── week6/
    ├── day26_report.md ~ day30_report.md
    ├── weekly_report.md
    └── phase1_final_report.md

---

변경 이력
| 날짜 | 버전 | 변경 내용 | 작성자 |
|---|---|---|---|
| 2026-04-23 | v1.0.0 | 최초 작성 | 앤팅 |
