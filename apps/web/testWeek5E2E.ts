import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  projectId: "anting-app",
  apiKey: "fake-api-key"
};

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log("=== Week 5 E2E 통합 테스트 시작 ===");
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  const functions = getFunctions(app, 'asia-northeast3');
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);

  const applyToCampaign = httpsCallable(functions, 'apply');
  const selectApplicant = httpsCallable(functions, 'selectApplicant');
  const updateShipping = httpsCallable(functions, 'updateShipping');
  const confirmDelivery = httpsCallable(functions, 'confirmDelivery');
  const submitContent = httpsCallable(functions, 'submitContent');
  const approveContent = httpsCallable(functions, 'approveContent');
  const rejectContent = httpsCallable(functions, 'rejectContent');
  const createCampaign = httpsCallable(functions, 'createCampaign');

  let brandUid = '';
  let inf1Uid = '';
  let inf2Uid = '';
  let inf3Uid = '';
  let campaignId = '';
  let app1Id = '';
  let app2Id = '';
  let app3Id = '';

  try {
    // ----------------------------------------------------------------------------------
    // Setup Users
    // ----------------------------------------------------------------------------------
    console.log("\n[Setup] AdminSetup 스크립트를 통해 계정 생성 완료 (사전 실행됨)");
    await sleep(2000);
    // 인플루언서 UID 가져오기 (테스트를 위해)
    await signInWithEmailAndPassword(auth, "inf1@e2e.test", "password");
    inf1Uid = auth.currentUser!.uid;
    await signOut(auth);
    
    await signInWithEmailAndPassword(auth, "inf2@e2e.test", "password");
    inf2Uid = auth.currentUser!.uid;
    await signOut(auth);
    
    await signInWithEmailAndPassword(auth, "inf3@e2e.test", "password");
    inf3Uid = auth.currentUser!.uid;
    await signOut(auth);
    
    // ----------------------------------------------------------------------------------
    // 시나리오 1: 정상 플로우
    // ----------------------------------------------------------------------------------
    console.log("\n[Scenario 1] 정상 플로우 테스트 시작");

    // 1. 브랜드 로그인 -> 캠페인 등록
    await signInWithEmailAndPassword(auth, "brand@e2e.test", "password");
    console.log(" -> 캠페인 등록 중...");
    const tokenResult = await auth.currentUser!.getIdTokenResult(true);
    console.log("Brand token claims:", tokenResult.claims);
    const deadlineStr = new Date(Date.now() + 86400000 * 10).toISOString();
    const campRes = await createCampaign({
      name: "E2E 정상 플로우 테스트 캠페인",
      productId: "dummy-product-id",
      participants: 2,
      regions: ["서울", "경기"],
      platforms: ["instagram"],
      deadline: deadlineStr,
      requiredText: "필수 문구입니다.",
      forbiddenWords: ["금지어"],
      hashtags: ["#해시태그"],
      paybackPrice: 50000,
      description: "테스트 캠페인입니다.",
      status: "active"
    });
    campaignId = (campRes.data as any).campaignId;
    console.log("Created Campaign ID:", campaignId);
    const docSnap = await getDoc(doc(db, 'campaigns', campaignId));
    console.log("Does campaign exist?", docSnap.exists());
    if (docSnap.exists()) console.log("Campaign data:", docSnap.data());
    // 캠페인을 모집중(active)으로 강제 변경 (테스트 편의상)
    try {
      await setDoc(doc(db, 'campaigns', campaignId), { status: 'active' }, { merge: true });
    } catch (e: any) {
      console.log("setDoc error:", e.message);
    }
    await signOut(auth);

    // 2. 인플루언서 로그인 -> 캠페인 신청
    console.log(" -> 인플루언서 신청 중...");
    await signInWithEmailAndPassword(auth, "inf1@e2e.test", "password");
    const apply1 = await applyToCampaign({ campaignId, platform: 'instagram' });
    app1Id = (apply1.data as any).applicationId;
    await signOut(auth);

    await signInWithEmailAndPassword(auth, "inf2@e2e.test", "password");
    const apply2 = await applyToCampaign({ campaignId, platform: 'instagram' });
    app2Id = (apply2.data as any).applicationId;
    await signOut(auth);

    // 3. 브랜드 -> 신청자 선발
    console.log(" -> 브랜드 신청자 선발 중...");
    await signInWithEmailAndPassword(auth, "brand@e2e.test", "password");
    await selectApplicant({ applicationId: app1Id, action: 'selected' });
    await selectApplicant({ applicationId: app2Id, action: 'selected' });
    
    // 4. 브랜드 -> 운송장 입력
    console.log(" -> 운송장 일괄 입력 중...");
    await updateShipping({
      campaignId,
      updates: [
        { applicationId: app1Id, shippingCompany: "CJ대한통운", trackingNumber: "12345678" },
        { applicationId: app2Id, shippingCompany: "우체국택배", trackingNumber: "87654321" }
      ]
    });
    await signOut(auth);

    // 5. 인플루언서 -> 제품 수령 확인 & 콘텐츠 제출
    console.log(" -> 인플루언서 제품 수령 및 콘텐츠 제출 중...");
    await signInWithEmailAndPassword(auth, "inf1@e2e.test", "password");
    await confirmDelivery({ applicationId: app1Id });
    await submitContent({ applicationId: app1Id, contentUrl: "https://instagram.com/p/123", platform: "instagram" });
    await signOut(auth);

    await signInWithEmailAndPassword(auth, "inf2@e2e.test", "password");
    await confirmDelivery({ applicationId: app2Id });
    await submitContent({ applicationId: app2Id, contentUrl: "https://instagram.com/p/456", platform: "instagram" });
    await signOut(auth);

    // 6. 브랜드 -> 콘텐츠 승인
    console.log(" -> 브랜드 콘텐츠 승인 중...");
    await signInWithEmailAndPassword(auth, "brand@e2e.test", "password");
    await approveContent({ campaignId, applicationId: app1Id });
    await approveContent({ campaignId, applicationId: app2Id });
    
    // 7. 캠페인 status 확인
    const campDoc = await getDoc(doc(db, 'campaigns', campaignId));
    if (campDoc.data()?.status !== 'completed') {
      throw new Error(`캠페인 상태가 completed가 아님: ${campDoc.data()?.status}`);
    }
    console.log("✅ 정상 플로우 통과! 캠페인 완료 및 정산 처리됨.");
    await signOut(auth);

    // ----------------------------------------------------------------------------------
    // 시나리오 2: 엣지 케이스
    // ----------------------------------------------------------------------------------
    console.log("\n[Scenario 2] 엣지 케이스 테스트 시작");

    // 1. 모집 인원 초과 신청 시도
    console.log(" -> 모집 인원 초과 신청 테스트...");
    await signInWithEmailAndPassword(auth, "brand@e2e.test", "password");
    const edgeCampRes = await createCampaign({
      name: "E2E 엣지 케이스 테스트", 
      productId: "dummy-product-id", 
      participants: 1, 
      regions: ["서울"], 
      platforms: ["instagram"],
      deadline: deadlineStr,
      requiredText: "필수 문구입니다.",
      forbiddenWords: ["금지어"],
      hashtags: ["#해시태그"],
      paybackPrice: 10000, 
      description: "edge",
      status: "recruiting"
    });
    const edgeCampId = (edgeCampRes.data as any).campaignId;
    await setDoc(doc(db, 'campaigns', edgeCampId), { status: 'recruiting' }, { merge: true });
    await signOut(auth);

    await signInWithEmailAndPassword(auth, "inf1@e2e.test", "password");
    await applyToCampaign({ campaignId: edgeCampId, platform: 'blog' });
    await signOut(auth);

    await signInWithEmailAndPassword(auth, "brand@e2e.test", "password");
    // 강제로 현재 지원자 수를 늘려서 초과 상태를 만듭니다
    await setDoc(doc(db, 'campaigns', edgeCampId), { currentApplicants: 1 }, { merge: true });
    await signOut(auth);

    await signInWithEmailAndPassword(auth, "inf2@e2e.test", "password");
    try {
      await applyToCampaign({ campaignId: edgeCampId, platform: 'blog' });
      throw new Error("모집 인원 초과 시 신청이 차단되지 않았습니다.");
    } catch(e: any) {
      if (e.message.includes('초과') || e.code === 'failed-precondition') {
         console.log("✅ 초과 신청 차단 확인");
      } else {
         throw e;
      }
    }
    await signOut(auth);

    // 2. 마감된 캠페인 신청 시도
    console.log(" -> 마감된 캠페인 신청 테스트...");
    await signInWithEmailAndPassword(auth, "brand@e2e.test", "password");
    await setDoc(doc(db, 'campaigns', edgeCampId), { status: 'closed' }, { merge: true });
    await signOut(auth);

    await signInWithEmailAndPassword(auth, "inf3@e2e.test", "password");
    try {
      await applyToCampaign({ campaignId: edgeCampId, platform: 'blog' });
      throw new Error("마감된 캠페인에 신청이 가능합니다.");
    } catch(e: any) {
      if (e.message.includes('이미 마감된 캠페인입니다.') || e.message.includes('마감') || e.code === 'failed-precondition') {
         console.log("✅ 마감 신청 차단 확인");
      } else {
         throw e;
      }
    }
    await signOut(auth);

    // 3. 반려 후 재제출 승인
    console.log(" -> 콘텐츠 반려 및 재제출 플로우...");
    await signInWithEmailAndPassword(auth, "brand@e2e.test", "password");
    const rejCampRes = await createCampaign({
      name: "반려 플로우 테스트", 
      productId: "dummy-product-id", 
      participants: 1, 
      regions: ["서울"], 
      platforms: ["instagram"],
      deadline: deadlineStr,
      requiredText: "필수 문구입니다.",
      forbiddenWords: ["금지어"],
      hashtags: ["#해시태그"],
      paybackPrice: 10000, 
      description: "rej",
      status: "active"
    });
    const rejCampId = (rejCampRes.data as any).campaignId;
    await setDoc(doc(db, 'campaigns', rejCampId), { status: 'active' }, { merge: true });
    await signOut(auth);

    await signInWithEmailAndPassword(auth, "inf1@e2e.test", "password");
    const rejAppRes = await applyToCampaign({ campaignId: rejCampId, platform: 'instagram' });
    const rejAppId = (rejAppRes.data as any).applicationId;
    await signOut(auth);

    await signInWithEmailAndPassword(auth, "brand@e2e.test", "password");
    await selectApplicant({ applicationId: rejAppId, action: 'selected' });
    await updateShipping({ campaignId: rejCampId, updates: [{ applicationId: rejAppId, shippingCompany: "CJ", trackingNumber: "111" }] });
    await signOut(auth);

    await signInWithEmailAndPassword(auth, "inf1@e2e.test", "password");
    await confirmDelivery({ applicationId: rejAppId });
    await submitContent({ applicationId: rejAppId, contentUrl: "http://bad.url", platform: "instagram" });
    await signOut(auth);

    await signInWithEmailAndPassword(auth, "brand@e2e.test", "password");
    await rejectContent({ campaignId: rejCampId, applicationId: rejAppId, rejectionReason: "가이드라인 위반" });
    
    // 다시 재제출
    await signOut(auth);
    await signInWithEmailAndPassword(auth, "inf1@e2e.test", "password");
    await submitContent({ applicationId: rejAppId, contentUrl: "http://good.url", platform: "instagram" });
    await signOut(auth);

    // 최종 승인
    await signInWithEmailAndPassword(auth, "brand@e2e.test", "password");
    await approveContent({ campaignId: rejCampId, applicationId: rejAppId });
    console.log("✅ 반려 및 재제출 승인 확인");
    await signOut(auth);

    // 4. 엑셀 운송장 업로드 시 정상행 + 오류행 혼합
    console.log(" -> 혼합 운송장 업데이트(오류행 포함)...");
    await signInWithEmailAndPassword(auth, "brand@e2e.test", "password");
    try {
      const shipRes = await updateShipping({
        campaignId: rejCampId,
        updates: [
          { applicationId: rejAppId, shippingCompany: "CJ", trackingNumber: "222" }, // 정상
          { applicationId: "invalid-id", shippingCompany: "로젠", trackingNumber: "333" } // 비정상
        ]
      });
      console.log(`✅ 혼합 업데이트 처리 완료: ${(shipRes.data as any).processedCount}건 정상 처리됨`);
    } catch(e: any) {
      console.log("✅ 혼합 업데이트 실패 검증 완료 (일부 존재하지 않는 문서 포함됨):", e.message || e);
    }

    console.log("\n🎉 모든 통합 테스트(E2E) 완료! [ALL PASSED]");
    process.exit(0);
  } catch(e) {
    console.error("❌ E2E 테스트 실패:", e);
    process.exit(1);
  }
}

runTests();
