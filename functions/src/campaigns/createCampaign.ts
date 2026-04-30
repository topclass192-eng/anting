import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { validateCampaignInput } from '../utils/validators';

export const createCampaign = onCall({ region: 'asia-northeast3' }, async (request) => {
  const { auth, data } = request;

  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  if (auth.token.role !== 'brand') {
    throw new HttpsError('permission-denied', '브랜드 계정만 캠페인을 등록할 수 있습니다.');
  }

  try {
    validateCampaignInput(data);
  } catch (error: any) {
    throw new HttpsError(error.code || 'invalid-argument', error.message || '잘못된 입력입니다.');
  }

  try {
    const db = admin.firestore();
    let campaignId = data.campaignId;

    const payload = {
      name: data.name,
      productId: data.productId,
      participants: data.participants,
      regions: data.regions,
      platforms: data.platforms,
      deadline: data.deadline,
      requiredText: data.requiredText,
      forbiddenWords: data.forbiddenWords || [],
      hashtags: data.hashtags || [],
      referenceUrls: data.referenceUrls || [],
      brandId: auth.uid || 'fallback',
      status: 'active',
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    console.log("PAYLOAD TO WRITE:", JSON.stringify({ ...payload, updatedAt: "SERVER_TIMESTAMP" }));

    if (campaignId) {
      // Update existing draft
      const docRef = db.collection('campaigns').doc(campaignId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        throw new HttpsError('not-found', '캠페인을 찾을 수 없습니다.');
      }
      
      if (doc.data()?.brandId !== auth.uid) {
        throw new HttpsError('permission-denied', '자신의 캠페인만 등록할 수 있습니다.');
      }

      await docRef.update(payload);
    } else {
      // Create new campaign
      const docRef = db.collection('campaigns').doc();
      campaignId = docRef.id;
      
      await docRef.set({
        ...payload,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    return { 
      success: true, 
      campaignId, 
      message: '캠페인이 등록되었습니다.' 
    };
  } catch (error: any) {
    console.error('캠페인 등록 실패:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '캠페인 등록에 실패했습니다.');
  }
});

