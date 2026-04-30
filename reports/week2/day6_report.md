# Phase 1 Week 2 Day 6 Report

## 1. Firestore Schema Initialization
`scripts/initFirestore.ts` 스크립트를 작성하고 실행을 완료하였습니다. 초기화 대상인 `users`, `brands`, `influencers`, `campaigns`, `applications`, `products` 컬렉션 구조가 올바르게 생성되었으며 각 컬렉션 당 샘플 데이터가 2~3건씩 성공적으로 삽입되었습니다.

## 2. Firestore Security Rules
`firestore.rules` 파일에 다음과 같은 Role-Based Access Control을 구현했습니다.
- **users**: 본인 정보 읽기/쓰기 가능, admin은 전체 읽기 가능.
- **brands**: 인증 유저는 전체 읽기 가능, 본인(brand 역할)만 자신 아이디 기반의 문서 쓰기 가능.
- **influencers**: 인증 유저는 전체 읽기 가능, 본인(influencer 역할)만 쓰기 가능.
- **campaigns**: 인증 유저는 전체 읽기 가능, 본인(brand 역할)만 쓰기 가능.
- **applications**: influencer 역할만 생성 가능, 관련 brand와 influencer (양측)가 읽기 기능, 본인(influencer)만 수정/삭제 가능.
- **products**: 인증 유저는 전체 읽기 가능, 관련된 brand 역할 유저만 생성/수정/삭제 가능.

## 3. Emulator Security Rules Test Results
Firestore emulator 환경 상에서 `@firebase/rules-unit-testing`을 활용한 자동화된 테스트를 작성(\`scripts/testRules.ts\`) 및 실행했습니다.

테스트 실행 결과는 모두 성공(통과)이었습니다.

| 시나리오 | 예상 결과 | 실제 결과 | 통과 여부 |
| --- | --- | --- | --- |
| ① 미인증 유저 -> 모든 컬렉션 읽기 시도 | 거부 | 거부 | ✅ 통과 |
| ② brand 역할 유저 -> campaigns 쓰기 | 허용 | 허용 | ✅ 통과 |
| ③ influencer 역할 유저 -> campaigns 쓰기 | 거부 | 거부 | ✅ 통과 |
| ④ 본인 users 문서 읽기 | 허용 | 허용 | ✅ 통과 |
| ⑤ 타인 users 문서 읽기 | 거부 | 거부 | ✅ 통과 |

## 4. 기타 기록
테스트 과정에서 호스트 OS에 Java Runtime(21버전)이 누락되어있어 `winget`을 통해 `Microsoft.OpenJDK.21`을 임시 설치하고 PATH를 리셋하여 Emulator를 정상적으로 시동할 수 있었습니다.
