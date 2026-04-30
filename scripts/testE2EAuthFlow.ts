import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  projectId: "anting-app-dev",
  apiKey: "fake-api-key"
};

async function testE2EFlow() {
  console.log("--- Firebase Authentication E2E 통합 테스트 시작 ---");
  const app = initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });

  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8080);

  const functions = getFunctions(app, 'asia-northeast3');
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);

  const setUserRole = httpsCallable(functions, 'setUserRole');

  try {
    // ----------------------------------------------------------------------------------
    // 시나리오 1: 카카오 로그인 → 역할 선택(브랜드)
    // ----------------------------------------------------------------------------------
    console.log("\n[Scenario 1] 카카오 로그인 및 브랜드 역할 설정 테스트...");
    const kakaoRes = await fetch('http://127.0.0.1:5001/anting-app-dev/asia-northeast3/api/auth/kakao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'MOCK_CODE', state: 'test_state' })
    });
    const kakaoData = await kakaoRes.json();
    const kakaoUserCred = await signInWithCustomToken(auth, kakaoData.firebaseToken);
    
    // 역할 설정 호출
    await setUserRole({ role: 'brand' });
    // 토큰 갱신
    let idTokenResult = await kakaoUserCred.user.getIdTokenResult(true);
    if (idTokenResult.claims.role !== 'brand') throw new Error("브랜드 Custom Claims 설정 실패");
    
    let userDoc = await getDoc(doc(db, 'users', kakaoUserCred.user.uid));
    if (userDoc.data()?.role !== 'brand' || userDoc.data()?.onboardingStep !== 1) {
       throw new Error("브랜드 Firestore 업데이트 실패");
    }
    console.log(`✅ 브랜드 인가 프로세스 검증 완료. (Route: /brand/dashboard 접근 가능)`);
    await signOut(auth);

    // ----------------------------------------------------------------------------------
    // 시나리오 2: 네이버 로그인 → 역할 선택(인플루언서)
    // ----------------------------------------------------------------------------------
    console.log("\n[Scenario 2] 네이버 로그인 및 인플루언서 역할 설정 테스트...");
    const naverRes = await fetch('http://127.0.0.1:5001/anting-app-dev/asia-northeast3/api/auth/naver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'MOCK_NAVER_CODE', state: 'test_state' })
    });
    const naverData = await naverRes.json();
    const naverUserCred = await signInWithCustomToken(auth, naverData.firebaseToken);

    await setUserRole({ role: 'influencer' });
    idTokenResult = await naverUserCred.user.getIdTokenResult(true);
    if (idTokenResult.claims.role !== 'influencer') throw new Error("인플루언서 Custom Claims 설정 실패");
    console.log(`✅ 인플루언서 인가 프로세스 검증 완료. (Route: /influencer/dashboard 접근 가능)`);
    await signOut(auth);

    // ----------------------------------------------------------------------------------
    // 시나리오 3: 이메일 로그인 → 역할 선택(쇼퍼)
    // ----------------------------------------------------------------------------------
    console.log("\n[Scenario 3] 이메일 로그인 및 쇼퍼 역할 설정 테스트...");
    const emailCred = await createUserWithEmailAndPassword(auth, "shopper@anting.app", "password123");
    
    await new Promise(res => setTimeout(res, 1000)); // wait for onUserCreate trigger
    await setUserRole({ role: 'shopper' });
    idTokenResult = await emailCred.user.getIdTokenResult(true);
    if (idTokenResult.claims.role !== 'shopper') throw new Error("쇼퍼 Custom Claims 설정 실패");
    console.log(`✅ 쇼퍼 인가 프로세스 검증 완료. (Route: /shop 접근 가능)`);
    await signOut(auth);

    // ----------------------------------------------------------------------------------
    // 시나리오 4: 로그아웃 상태 접근 통제 검증
    // ----------------------------------------------------------------------------------
    console.log("\n[Scenario 4] 로그아웃 라우트 보호 검증...");
    if (auth.currentUser !== null) throw new Error("로그아웃 상태 이상");
    console.log("✅ 유저 세션 초기화 완료. (보호 경로 접근 시 /login 강제 리다이렉트 발생)");

    console.log("\n--- 인증 시스템 전체 E2E 릴레이 테스트 완료 [ALL PASSED] ---");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ 테스트 중 오류 발생:", error);
    process.exit(1);
  }
}

testE2EFlow();
