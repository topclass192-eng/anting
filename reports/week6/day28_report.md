# Day 28: 모바일 최적화 및 PWA, 성능 설정 완료 보고서

## 1. 개요
- **목적**: 앤팅(Anting) 웹앱의 모바일 사용성(UI/UX) 최적화와 로딩 성능 개선(Code Splitting), 그리고 Progressive Web App (PWA) 구동을 위한 기초 환경 구축
- **작업 내역**:
  - PWA `manifest.json` 세팅
  - 모바일 터치 영역 및 스크롤 영역 일관성 보장 (`pb-24`)
  - 코드 스플리팅 (`React.lazy`, `Suspense`)
  - 공통 로딩 스켈레톤(`Skeleton.tsx`) 컴포넌트 추가

## 2. 주요 구현 내용

### 2.1. PWA `manifest.json` 설정
- **경로**: `apps/web/public/manifest.json`
- 사용자가 웹앱을 '홈 화면에 추가'할 수 있도록 스탠드얼론(Standalone) 모드를 활성화했습니다.
- 브랜드 컬러 스펙에 맞추어 `theme_color`(#6B7A3E) 및 `background_color`(#F5F0E8)를 적용해 PWA 진입 시 네이티브 앱과 같은 사용성을 부여했습니다.

### 2.2. 모바일 UI/UX 최적화 (Cross Browser)
- **최소 터치 영역 보장**: 화면 내 액션 버튼(FAB, CTA 등)의 최소 크기를 iOS/Android 터치 가이드라인에 맞춘 `44px × 44px` 이상으로 확보했습니다.
- **텍스트 최소 크기 제한**: Tailwind 기본 유틸리티를 사용해 읽기 편한 14px(`text-sm`) 이상의 텍스트를 유지했습니다.
- **하단 탭 가림 현상 방지**: 모든 메인 페이지 래퍼 레이아웃에 `pb-24`(96px) 패딩을 일괄 적용하여 스크롤 시 콘텐츠가 하단 `BottomNav`에 가려지는 문제를 원천 차단했습니다.

### 2.3. 기초 성능 최적화 (Code Splitting)
- **경로**: `apps/web/src/App.tsx`
- **적용 방식**: 앱 진입 시 전체 번들을 한 번에 다운로드하는 대신, 각 페이지(라우트) 접근 시점에 JS 번들을 분할 로드하도록 `React.lazy`를 전면 도입했습니다.
- **Suspense 처리**: 페이지가 동적으로 불러와지는 찰나의 순간, 사용자가 어색함을 느끼지 않도록 스피너 애니메이션 형태의 `PageLoader`를 Fallback UI로 연결했습니다.

### 2.4. 스켈레톤(Skeleton) 컴포넌트 구축
- **경로**: `apps/web/src/components/common/Skeleton.tsx`
- **목적**: 이미지나 무거운 데이터를 불러오는 동안, UI 레이아웃의 점프(Layout Shift) 현상을 방지하고 체감 대기 시간을 줄이기 위한 범용 Placeholder 컴포넌트입니다.
- **특징**: `rectangular`, `circular`, `text` 형태를 프로퍼티로 동적 지원하며 기본적으로 부드러운 펄스 애니메이션(`animate-pulse`)을 탑재했습니다. 향후 리스트 렌더링 시 결합하여 사용할 수 있습니다.

## 3. 결과 및 크로스 브라우저 호환성
- 적용된 모든 코드는 표준 HTML/CSS 속성 및 React 아키텍처를 준수하여 작성되었습니다. 
- iOS Safari 및 Android Chrome, 데스크톱 등 환경 간 디자인 불일치 요소들을 CSS 유틸리티로 정리했으며, PWA 및 코드 스플리팅 도입에 따라 **초기 로딩 속도(FCP) 단축**이 기대됩니다.
