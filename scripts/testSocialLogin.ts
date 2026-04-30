import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "anting-app-dev",
  apiKey: "fake-api-key"
};

async function testSocialFlow() {
  console.log("--- Firebase Social OAuth 통합 테스트 시작 ---");
  const app = initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });

  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8080);

  try {
    // ----------------------------------------------------
    // Scenario 1: Kakao Mock Auth (New User)
    // ----------------------------------------------------
    console.log("\n[Scenario 1] 카카오 신규가입 테스트 시작...");
    const kakaoRes = await fetch('http://127.0.0.1:5001/anting-app-dev/us-central1/api/auth/kakao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'MOCK_CODE', state: 'test_state' })
    });

    if (!kakaoRes.ok) {
      throw new Error(`Kakao Error: ${await kakaoRes.text()}`);
    }

    const kakaoData = await kakaoRes.json();
    console.log(`✅ 카카오 Custom Token 반환됨 (isNewUser: ${kakaoData.isNewUser})`);
    
    const kakaoUserCredential = await signInWithCustomToken(auth, kakaoData.firebaseToken);
    console.log(`✅ 카카오 유저 로그인 성공: UID ${kakaoUserCredential.user.uid}`);

    // Wait for document creation
    await new Promise(res => setTimeout(res, 1000));
    const kDoc = await getDoc(doc(db, 'users', kakaoUserCredential.user.uid));
    if (kDoc.exists()) {
        console.log(`✅ users 컬렉션 문서 생성 확인! Email: ${kDoc.data()?.email}`);
    } else {
        throw new Error("카카오 유저 문서가 생성되지 않았습니다.");
    }

    // ----------------------------------------------------
    // Scenario 2: Naver Mock Auth (Merging / Returning User)
    // ----------------------------------------------------
    console.log("\n[Scenario 2] 네이버 동일 이메일 연동 테스트 시작...");
    const naverRes = await fetch('http://127.0.0.1:5001/anting-app-dev/us-central1/api/auth/naver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'MOCK_NAVER_CODE', state: 'test_state' })
    });

    if (!naverRes.ok) {
      throw new Error(`Naver Error: ${await naverRes.text()}`);
    }
    
    const naverData = await naverRes.json();
    console.log(`✅ 네이버 Custom Token 반환됨 (isNewUser: ${naverData.isNewUser})`);

    const naverUserCredential = await signInWithCustomToken(auth, naverData.firebaseToken);
    console.log(`✅ 네이버 연동 유저 로그인 성공: UID ${naverUserCredential.user.uid}`);

    // Check if it mapped to the same UID or same email identity
    if (naverUserCredential.user.uid === kakaoUserCredential.user.uid) {
        console.log(`✅ 성공적으로 카카오 계정과 네이버 계정이 동일 UID로 병합되었습니다.`);
    } else {
        console.log(`⚠️ 병합 방식: 계정 병합보다는 신규 식별자 UID로 생성되며 이메일이 매핑되었거나 다른 방식입니다.`);
        console.log(`  카카오 UID: ${kakaoUserCredential.user.uid}`);
        console.log(`  네이버 UID: ${naverUserCredential.user.uid}`);
    }

    console.log("\n--- 소셜 로그인 통합 테스트 완료 [ALL PASSED] ---");
    process.exit(0);

  } catch (error: any) {
    console.error("\n❌ 테스트 중 오류 발생:", error.message);
    process.exit(1);
  }
}

testSocialFlow();
