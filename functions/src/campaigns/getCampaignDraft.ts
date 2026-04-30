import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export const getCampaignDraft = onCall(async (request) => {
  const { auth } = request;

  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  if (auth.token.role !== 'brand') {
    throw new HttpsError('permission-denied', '브랜드 계정만 캠페인을 조회할 수 있습니다.');
  }

  try {
    const db = admin.firestore();
    const querySnapshot = await db.collection('campaigns')
      .where('brandId', '==', auth.uid)
      .where('status', '==', 'draft')
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return { success: true, draft: null };
    }

    const doc = querySnapshot.docs[0];
    const draftData = doc.data();

    return {
      success: true,
      draft: {
        id: doc.id,
        ...draftData,
        createdAt: draftData.createdAt?.toMillis() || Date.now(),
        updatedAt: draftData.updatedAt?.toMillis() || Date.now()
      }
    };
  } catch (error: any) {
    console.error('드래프트 조회 실패:', error);
    throw new HttpsError('internal', '임시 저장 데이터를 불러오는 데 실패했습니다.');
  }
});
