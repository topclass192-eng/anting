# Day 3 작업 보고서
> 날짜: 2026-04-23 | Week 1 | Phase 1

## 1. 오늘의 작업 목표
- [x] firebase.json 설정 변경
- [x] 환경별 .env 파일 구성 및 .env.example 연동
- [x] GitHub Actions (staging, production) 추가
- [x] React PWA 프로젝트 생성 및 기본 구조 정리
- [x] 스테이징 첫 배포 및 "Hello, 앤팅!" 확인

## 2. 완료된 작업
### 2-1. Firebase 및 GitHub 파이프라인 구성
- 구현 내용: Hosting, Functions 노드 버전, 에뮬레이터 포트 세팅, staging/production 브랜치 트리거 워크플로우 구성 및 API Key 모듈 분리
- 주요 파일: `firebase.json`, `.github/workflows/deploy-*.yml`, `.env.*`
- 관련 커밋: 

### 2-2. React PWA 초기화
- 구현 내용: CRA(Create React App) TypeScript 템플릿 기반으로 React 앱 생성 후, 불필요한 기본 이미지 및 테스트 파일 제거, App 컴포넌트 간소화 (Hello 출력)
- 주요 파일: `apps/web/src/App.tsx`, `apps/web/src/index.tsx`
- 관련 커밋: 

## 3. 발생한 오류 및 수정 내역
### 오류 1
- 오류 내용: `npm run build` 과정에서 React 컴파일러가 삭제된 파일(`reportWebVitals.ts`) 모듈을 찾지 못하여 빌드 실패
- 오류 원인: 초기 셋업 중 불필요 파일 정리 시, `src/index.tsx` 내 `reportWebVitals` 임포트부 및 호출 로직을 함께 지우지 않아 발생한 참조 오류
- 수정 방법: `apps/web/src/index.tsx` 파일 내에서 해당 모듈의 `import` 구문과 `reportWebVitals();` 호출문을 삭제 후 정상 빌드 수행
- 수정 파일: `apps/web/src/index.tsx`
- 심각도: P1

### 오류 2
- 오류 내용: Firebase Hosting 로컬 배포 시도 중 `Error: Could not determine the default site for the project.` 로그 발생하며 실패
- 오류 원인: 터미널로 GCP 프로젝트만 생성하고 Firebase 내부에서 Hosting 기본 사이트가 할당되지 않아 발생 (인프라 프로비저닝 오류)
- 수정 방법: Firebase Console에서 "Hosting 시작하기"를 직접 수동 클릭하여 기본 사이트를 할당해 주거나 CLI상에서 site creation API가 권한 문제 없이 동작해야 함
- 수정 파일: N/A
- 심각도: P1

## 4. 미완료 작업 및 사유
- 미완료 항목: 스테이징 도메인 배포 성공 URL 확인
- 사유: 상술한 '오류 2' 원인으로 인해 로컬 콘솔 명령어로 배포 링크를 확보하지 못함. GitHub Secrets 구성 완료 후 GitHub Actions가 이를 덮어쓰도록 유도 요망.

## 5. 내일 작업 계획
- [ ] CI/CD가 구동되는 배포 검토
- [ ] 본격적인 프론트엔드 UI/UX 작업 착수

## 6. 특이사항 및 건의
- (안내) GitHub Actions 구동을 위한 `FIREBASE_SERVICE_ACCOUNT` 시크릿값이 세팅되어야 정상 파이프라인 동작을 검증할 수 있습니다.
