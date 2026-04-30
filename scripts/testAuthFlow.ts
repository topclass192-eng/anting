import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

// Emulators must be running when this script executes
const firebaseConfig = {
  projectId: "demo-project",
  apiKey: "fake-api-key"
};

async function testFullFlow() {
  console.log("--- Firebase Auth & Custom Claims 전체 플로우 테스트 시작 ---");
  const app = initializeApp(firebaseConfig);
  
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");

  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8080);

  const functions = getFunctions(app);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);

  try {
    // 1. 이메일 회원가입
    console.log("1. 이메일 회원가입 테스트...");
    const email = `testuser_${Date.now()}@anting.app`;
    const password = "password123";
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`✅ 회원가입 성공: ${user.uid} (${user.email})`);

    // 2. onUserCreate & 3. users 컬렉션 문서 확인
    console.log("\n2. onUserCreate 트리거 대기 및 users 컬렉션 문서 확인...");
    
    // Cloud function trigger might take a split second. Let's poll for max 5 seconds.
    let createdDoc = null;
    const userDocRef = doc(db, 'users', user.uid);
    for (let i = 0; i < 10; i++) {
        await new Promise(res => setTimeout(res, 500));
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
            createdDoc = snap.data();
            break;
        }
    }

    if (!createdDoc) {
      console.error(`❌ users 문서가 생성되지 않았습니다! (onUserCreate 미작동 합리적 추정)`);
      process.exit(1);
    }
    console.log(`✅ users 문서 생성 성공! 데이터:`, createdDoc);

    // 4. setUserRole 함수 호출
    console.log("\n3. setUserRole 함수 호출 (초기 역할 설정 'influencer')...");
    const setUserRole = httpsCallable(functions, 'setUserRole');
    
    try {
      const response = await setUserRole({ userId: user.uid, role: 'influencer' });
      console.log(`✅ setUserRole 호출 완료:`, response.data);
    } catch (err: any) {
      console.error(`❌ setUserRole 호출 실패:`, err.message);
      process.exit(1);
    }

    // 문서에 role 업데이트 확인
    const updatedUserSnap = await getDoc(userDocRef);
    if (updatedUserSnap.exists() && updatedUserSnap.data().role === 'influencer') {
        console.log(`✅ users 컬렉션의 role 필드가 'influencer'로 성공적으로 업데이트 되었습니다.`);
    } else {
        console.error(`❌ users 컬렉션의 role 필드가 업데이트되지 않았습니다.`);
        process.exit(1);
    }

    // 5. Custom Claims 설정 확인
    console.log("\n4. Custom Claims 설정 확인 (토큰 갱신)...");
    await user.getIdToken(true); // Force refresh
    const idTokenResult = await user.getIdTokenResult();
    
    if (idTokenResult.claims.role === 'influencer') {
        console.log(`✅ Custom Claims 'role: influencer' 확인 성공!`);
    } else {
        console.error(`❌ Custom Claims 'role'이 설정되지 않았거나 잘못 설정되었습니다:`, idTokenResult.claims);
        process.exit(1);
    }

    console.log("\n--- 전체 플로우 테스트 완료 [ALL PASSED] ---");
    process.exit(0);

  } catch (error: any) {
      console.error("\n❌ 테스트 중 오류 발생:", error.message);
      process.exit(1);
  }
}

testFullFlow();
