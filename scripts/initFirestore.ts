import * as admin from 'firebase-admin';

// Set emulator host before initializing
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

admin.initializeApp({
  projectId: 'demo-project'
});

const db = admin.firestore();

export const initializeFirestore = async () => {
    console.log("Firestore 컬렉션 초기화 스크립트 실행 시작.");
    
    const now = admin.firestore.FieldValue.serverTimestamp();

    // 1. users
    const users = [
      { id: 'admin1', email: 'admin@anting.app', role: 'admin', createdAt: now, updatedAt: now },
      { id: 'brand1', email: 'brand1@test.com', role: 'brand', createdAt: now, updatedAt: now },
      { id: 'brand2', email: 'brand2@test.com', role: 'brand', createdAt: now, updatedAt: now },
      { id: 'influencer1', email: 'inf1@test.com', role: 'influencer', createdAt: now, updatedAt: now },
      { id: 'influencer2', email: 'inf2@test.com', role: 'influencer', createdAt: now, updatedAt: now },
      { id: 'viewer1', email: 'viewer@test.com', role: 'viewer', createdAt: now, updatedAt: now },
    ];
    for (const u of users) {
      await db.collection('users').doc(u.id).set(u);
    }

    // 2. brands
    const brands = [
      { id: 'brand1', userId: 'brand1', companyName: 'Brand One', managerName: 'Manager A', createdAt: now },
      { id: 'brand2', userId: 'brand2', companyName: 'Brand Two', managerName: 'Manager B', createdAt: now },
    ];
    for (const b of brands) {
      await db.collection('brands').doc(b.id).set(b);
    }

    // 3. influencers
    const influencers = [
      { id: 'influencer1', userId: 'influencer1', nickName: 'Inf One', grade: 'A', createdAt: now },
      { id: 'influencer2', userId: 'influencer2', nickName: 'Inf Two', grade: 'B', createdAt: now },
    ];
    for (const i of influencers) {
      await db.collection('influencers').doc(i.id).set(i);
    }

    // 4. campaigns (created by brand)
    const campaigns = [
      { id: 'camp1', brandId: 'brand1', title: 'Summer Campaign', status: 'active', createdAt: now },
      { id: 'camp2', brandId: 'brand2', title: 'Winter Campaign', status: 'draft', createdAt: now },
    ];
    for (const c of campaigns) {
      await db.collection('campaigns').doc(c.id).set(c);
    }

    // 5. applications (created by influencer)
    const applications = [
      { id: 'app1', campaignId: 'camp1', influencerId: 'influencer1', status: 'pending', createdAt: now },
      { id: 'app2', campaignId: 'camp1', influencerId: 'influencer2', status: 'approved', createdAt: now },
    ];
    for (const a of applications) {
      await db.collection('applications').doc(a.id).set(a);
    }

    // 6. products (created by brand)
    const products = [
      { id: 'prod1', brandId: 'brand1', name: 'Cool Shirt', price: 20000, createdAt: now },
      { id: 'prod2', brandId: 'brand2', name: 'Warm Jacket', price: 50000, createdAt: now },
    ];
    for (const p of products) {
      await db.collection('products').doc(p.id).set(p);
    }

    console.log("초기화 대상 Collections (users, brands, influencers, campaigns, applications, products) 완료.");
};

if (require.main === module) {
    initializeFirestore().then(() => {
        console.log("초기화 완료");
        process.exit(0);
    }).catch(console.error);
}
