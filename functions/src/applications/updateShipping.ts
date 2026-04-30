import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const updateShipping = functions.region('asia-northeast3').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'ë¡œê·¸?¸ì´ ?„ìš”???œë¹„?¤ì…?ˆë‹¤.'
    );
  }

  // Expecting an array of shipping updates
  // updates: [{ applicationId: string, shippingCompany: string, trackingNumber: string }]
  const { campaignId, updates } = data;

  if (!campaignId || !updates || !Array.isArray(updates)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      '?˜ëª»???”ì²­?…ë‹ˆ??'
    );
  }

  const db = admin.firestore();

  try {
    // 1. Security Check: Ensure the user is the owner of the campaign
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'ìº í˜?¸ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
    }

    const campaignData = campaignSnap.data()!;
    if (campaignData.brandId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', '?´ë‹¹ ìº í˜?¸ì˜ ?´ì†¡?¥ì„ ?…ë°?´íŠ¸??ê¶Œí•œ???†ìŠµ?ˆë‹¤.');
    }

    // 2. Perform Batch Update
    const batch = db.batch();
    
    // To avoid too large batches, limit to 500 (Firestore limit)
    // For normal usage, it should be way below 500.
    const limitedUpdates = updates.slice(0, 500);

    for (const update of limitedUpdates) {
      const { applicationId, shippingCompany, trackingNumber } = update;
      
      if (!applicationId || !shippingCompany || !trackingNumber) continue;

      const appRef = db.collection('applications').doc(applicationId);
      
      batch.update(appRef, {
        shippingCompany,
        trackingNumber,
        shippingUpdatedAt: new Date().toISOString()
      });
    }

    await batch.commit();

    return { success: true, processedCount: limitedUpdates.length };

  } catch (error) {
    console.error('Error updating shipping info:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      '?´ì†¡???…ë°?´íŠ¸ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.'
    );
  }
});
