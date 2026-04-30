import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';

let testEnv: RulesTestEnvironment;

async function setupEnv() {
  const rules = readFileSync(resolve(__dirname, '../firestore.rules'), 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-project',
    firestore: {
      rules,
      host: '127.0.0.1',
      port: 8080,
    },
  });
}

async function runTests() {
  console.log('--- 보안 규칙 테스트 시작 ---');

  let passed = 0;
  let failed = 0;
  
  const results: Array<{ scenario: string, expected: boolean, actual: boolean, pass: boolean }> = [];

  const assertFails = async (promise: Promise<any>, scenario: string) => {
    try {
      await promise;
      results.push({ scenario, expected: false, actual: true, pass: false });
      console.error(`❌ 실패: ${scenario} (거부되어야 하나 허용됨)`);
      failed++;
    } catch (err: any) {
      results.push({ scenario, expected: false, actual: false, pass: true });
      console.log(`✅ 성공: ${scenario}`);
      passed++;
    }
  };

  const assertSucceeds = async (promise: Promise<any>, scenario: string) => {
    try {
      await promise;
      results.push({ scenario, expected: true, actual: true, pass: true });
      console.log(`✅ 성공: ${scenario}`);
      passed++;
    } catch (err: any) {
      results.push({ scenario, expected: true, actual: false, pass: false });
      console.error(`❌ 실패: ${scenario} (허용되어야 하나 거부됨: ${err.message})`);
      failed++;
    }
  };

  // Setup initial state using admin
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const batch = db.batch();
    // brand doc
    batch.set(db.doc('users/brand_user_1'), { role: 'brand' });
    batch.set(db.doc('users/influencer_user_1'), { role: 'influencer' });
    // campaign
    batch.set(db.doc('campaigns/camp_1'), { brandId: 'brand_user_1', title: 'Test Camp' });
    await batch.commit();
  });

  // 1. 미인증 유저 -> 모든 컬렉션 읽기 시도 -> 거부 확인
  const unauthContext = testEnv.unauthenticatedContext();
  await assertFails(unauthContext.firestore().collection('campaigns').get(), '① 미인증 유저 -> 모든 컬렉션 읽기 시도');

  // 2. brand 역할 유저 -> campaigns 쓰기 -> 허용 확인
  const brandContext = testEnv.authenticatedContext('brand_user_1');
  await assertSucceeds(
    brandContext.firestore().collection('campaigns').doc('camp_new').set({
      brandId: 'brand_user_1',
      title: 'New Campaign'
    }),
    '② brand 역할 유저 -> campaigns 쓰기'
  );

  // 3. influencer 역할 유저 -> campaigns 쓰기 -> 거부 확인
  const infContext = testEnv.authenticatedContext('influencer_user_1');
  await assertFails(
    infContext.firestore().collection('campaigns').doc('camp_new2').set({
      brandId: 'influencer_user_1',
      title: 'Hacked Campaign'
    }),
    '③ influencer 역할 유저 -> campaigns 쓰기'
  );

  // 4. 본인 users 문서 읽기 -> 허용 확인
  await assertSucceeds(
    infContext.firestore().doc('users/influencer_user_1').get(),
    '④ 본인 users 문서 읽기'
  );

  // 5. 타인 users 문서 읽기 -> 거부 확인
  await assertFails(
    infContext.firestore().doc('users/brand_user_1').get(),
    '⑤ 타인 users 문서 읽기'
  );

  console.log(`\n--- 테스트 결과: ${passed} 통과, ${failed} 실패 ---`);
  
  console.log('\n| 시나리오 | 예상 결과 | 실제 결과 | 통과 여부 |');
  console.log('|---|---|---|---|');
  results.forEach(r => {
    const expected = r.expected ? '허용' : '거부';
    const actual = r.actual ? '허용' : '거부';
    const pass = r.pass ? '✅ 통과' : '❌ 실패';
    console.log(`| ${r.scenario} | ${expected} | ${actual} | ${pass} |`);
  });

  if (failed > 0) {
    process.exit(1);
  }
}

setupEnv().then(runTests).then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
