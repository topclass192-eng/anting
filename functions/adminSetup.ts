import * as admin from 'firebase-admin';

process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({ projectId: "anting-app" });

async function setup() {
  const db = admin.firestore();
  const auth = admin.auth();
  
  const createOrUpdateUser = async (email: string, role: string, nicknameOrCompany: string, collectionName: string) => {
    let uid;
    try {
      const user = await auth.createUser({ email, password: 'password' });
      uid = user.uid;
    } catch(e) {
      const user = await auth.getUserByEmail(email);
      uid = user.uid;
    }
    
    await auth.setCustomUserClaims(uid, { role });
    await db.collection('users').doc(uid).set({ email, role }, { merge: true });
    
    if (role === 'brand') {
      await db.collection('brands').doc(uid).set({ companyName: nicknameOrCompany }, { merge: true });
    } else {
      await db.collection('influencers').doc(uid).set({ nickname: nicknameOrCompany }, { merge: true });
    }
    console.log(`Created user ${email} with uid ${uid}`);
  };

  await createOrUpdateUser("brand@e2e.test", "brand", "E2E Brand", "brands");
  await createOrUpdateUser("inf1@e2e.test", "influencer", "Inf 1", "influencers");
  await createOrUpdateUser("inf2@e2e.test", "influencer", "Inf 2", "influencers");
  await createOrUpdateUser("inf3@e2e.test", "influencer", "Inf 3", "influencers");
  
  console.log("Admin setup complete!");
}

setup().catch(console.error);
