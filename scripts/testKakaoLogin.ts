import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "demo-project",
  apiKey: "fake-api-key"
};

async function testKakaoFlow() {
  console.log("--- Firebase Kakao OAuth 전체 플로우 테스트 시작 ---");
  const app = initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");

  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8080);

  try {
    // 1. Simulate frontend calling our Express /api/auth/kakao endpoint with 'MOCK_CODE'
    console.log("1. Cloud Function 엔드포인트(/api/auth/kakao)에 MOCK_CODE 전송...");
    const response = await fetch('http://127.0.0.1:5001/demo-project/us-central1/api/auth/kakao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'MOCK_CODE' })
    });

    if (!response.ok) {
      console.error(`❌ Cloud Function 호출 실패:`, await response.text());
      process.exit(1);
    }

    const data = await response.json();
    console.log(`✅ 응답 성공: firebaseToken 이 반환됨 (isNewUser: ${data.isNewUser})`);

    // 2. Firebase Custom Token 로그인
    console.log("\n2. signInWithCustomToken 로그인 테스트...");
    const userCredential = await signInWithCustomToken(auth, data.firebaseToken);
    const user = userCredential.user;
    console.log(`✅ Custom Token 로그인 성공! User UID: ${user.uid} (${user.email})`);

    // 3. onUserCreate & users 문서 확인
    console.log("\n3. users 컬렉션 문서 확인 대기중...");
    let createdDoc = null;
    const userDocRef = doc(db, 'users', user.uid);
    for (let i = 0; i < 15; i++) {
        await new Promise(res => setTimeout(res, 500));
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
            createdDoc = snap.data();
            break;
        }
    }

    if (!createdDoc) {
      console.error(`❌ users 문서가 생성되지 않았습니다!`);
      process.exit(1);
    }
    console.log(`✅ users 문서 생성 확인됨:`, createdDoc);

    console.log("\n--- 카카오 로그인 플로우 테스트 완료 [ALL PASSED] ---");
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ 테스트 중 오류 발생:", error.message);
    process.exit(1);
  }
}

testKakaoFlow();
