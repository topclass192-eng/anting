import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { validateCampaignDraft } from '../utils/validators';

export const saveCampaignDraft = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  if (auth.token.role !== 'brand') {
    throw new HttpsError('permission-denied', '브랜드 계정만 캠페인을 저장할 수 있습니다.');
  }

  try {
    validateCampaignDraft(data);
  } catch (error: any) {
    throw new HttpsError(error.code || 'invalid-argument', error.message || '잘못된 입력입니다.');
  }

  try {
    const db = admin.firestore();
    let campaignId = data.campaignId;

    if (campaignId) {
      // 기존 드래프트 업데이트
      const docRef = db.collection('campaigns').doc(campaignId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new HttpsError('not-found', '캠페인을 찾을 수 없습니다.');
      }
      
      if (doc.data()?.brandId !== auth.uid) {
        throw new HttpsError('permission-denied', '자신의 캠페인만 수정할 수 있습니다.');
      }

      await docRef.update({
        ...data,
        status: 'draft',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // 새 드래프트 생성
      const docRef = db.collection('campaigns').doc();
      campaignId = docRef.id;
      
      await docRef.set({
        ...data,
        brandId: auth.uid,
        status: 'draft',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { success: true, campaignId };
  } catch (error: any) {
    console.error('드래프트 저장 실패:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '임시 저장에 실패했습니다.');
  }
});
