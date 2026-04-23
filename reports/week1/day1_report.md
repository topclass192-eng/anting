# Day 1 작업 보고서
> 날짜: 2026-04-23 | Week 1 | Phase 1

## 1. 오늘의 작업 목표
- [x] rules.md 생성 및 저장
- [x] GCP 프로젝트 anting-app 생성
- [x] Firebase 프로젝트 초기화 및 규칙 설정
- [x] GitHub 모노레포 초기화 (.gitignore, README.md 등)
- [x] Firebase Emulator Suite 설치 및 실행 확인
- [x] 초기 커밋 ("chore: 앤팅 프로젝트 초기 세팅")
- [x] 일일 보고서 작성

## 2. 완료된 작업
### 2-1. 프로젝트 기초 설정
- 구현 내용: 디렉토리 구조 생성(reports, apps, functions), Git 저장소 초기화, rules.md 및 README, .gitignore 작성
- 주요 파일: `rules.md`, `.gitignore`, `README.md`
- 관련 커밋: 

### 2-2. GCP 및 Firebase 설정
- 구현 내용: GCP 프로젝트 `anting-app` 생성, Firebase `firebase.json` 및 `firestore.rules`, `storage.rules` 등 구성, Functions `package.json` 세팅, 환경 변수 분리
- 주요 파일: `firebase.json`, `firestore.rules`, `storage.rules`, `.firebaserc`, `.env.*`
- 관련 커밋: 

## 3. 발생한 오류 및 수정 내역
### 오류 1
- 오류 내용: 로컬 환경에 `firebase` CLI가 설치되지 않아 명령어 실행 실패
- 오류 원인: 전역에 `firebase-tools`가 설치되어 있지 않거나 시스템 환경 변수 누락
- 수정 방법: `npx -y firebase-tools`를 사용하여 패키지를 임시 설치 및 실행
- 수정 파일: (N/A) 명령어만 수정하여 터미널 직접 실행
- 심각도: P1

## 4. 미완료 작업 및 사유
- 미완료 항목: 없음
- 사유: 계획된 모든 내용 작업 완료

## 5. 내일 작업 계획
- [ ] Firebase Authentication 및 Firestore 스키마 구성 기반 작업 진행
- [ ] 프론트엔드 React 기반 설정

## 6. 특이사항 및 건의
- 없음
