/**
 * scripts/initFirestore.ts
 * Firestore 컬렉션 초기화 및 인덱스 구성 안내 스크립트.
 *
 * 본 파일은 Phase 1 MVP 구성을 위한 초기 구조 문서화 목적으로 작성되었습니다.
 * 실제 데이터 주입을 원할 경우 firebase-admin을 활용하도록 구성되어야 합니다.
 */

/*
// Firebase Admin SDK 초기화 예시
import * as admin from 'firebase-admin';
admin.initializeApp();
const db = admin.firestore();

// 1. users Collection
async function initUsers() {
  // Collection: users
  // Single-field index: role (Asc), createdAt (Desc)
  const userRef = db.collection('users').doc('admin_user_01');
  await userRef.set({
    email: 'admin@anting.app',
    displayName: 'Admin User',
    role: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// 2. brands Collection
async function initBrands() {
  // Collection: brands
  // Use users.id as Doc ID (1:1 relationship)
  // Single-field index: createdAt (Desc)
  const brandRef = db.collection('brands').doc('brand_user_01');
  await brandRef.set({
    userId: 'brand_user_01',
    companyName: 'Test Brand',
    businessRegistrationNumber: '123-45-67890',
    managerName: 'Jane Doe',
    managerPhone: '010-1234-5678',
    managerEmail: 'contact@brand.com',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// 3. influencers Collection
// Single-field index: grade (Asc), createdAt (Desc)

// 4. campaigns Collection
// Composite index: brandId (Asc), status (Asc)
// Single-field index: status (Asc), createdAt (Desc)

// 5. applications Collection
// Composite index: campaignId (Asc), status (Asc)
// Composite index: influencerId (Asc), status (Asc)

// 6. products Collection, 7. orders Collection, 8. points Collection
// ... Setup initial reference patterns here
*/

export const initializeFirestore = async () => {
    console.log("Firestore 컬렉션 초기화 스크립트 실행 시작.");
    console.log("초기화 대상 Collections: users, brands, influencers, campaigns, applications, products, orders, points, notifications");
    console.log("실제 데이터 초기화가 필요한 경우 주석 처리된 firebase-admin 구현체를 활성화하여 실행하세요.");
};

if (require.main === module) {
    initializeFirestore().catch(console.error);
}
