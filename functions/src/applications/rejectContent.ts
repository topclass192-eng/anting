import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const rejectContent = functions.region('asia-northeast3').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'ë¡œê·¸?¸ì´ ?„ìš”???œë¹„?¤ì…?ˆë‹¤.');
  }

  const { applicationId, campaignId, rejectionReason } = data;

  if (!applicationId || !campaignId || !rejectionReason) {
    throw new functions.https.HttpsError('invalid-argument', '?˜ëª»???”ì²­?…ë‹ˆ??');
  }

  if (rejectionReason.length > 200) {
    throw new functions.https.HttpsError('invalid-argument', 'ë°˜ë ¤ ?¬ìœ ??200???´ë‚´?¬ì•¼ ?©ë‹ˆ??');
  }

  const db = admin.firestore();

  try {
    // 1. Security Check
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'ìº í˜?¸ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
    }

    if (campaignSnap.data()?.brandId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'ê¶Œí•œ???†ìŠµ?ˆë‹¤.');
    }

    // 2. Reject Application
    const appRef = db.collection('applications').doc(applicationId);
    await appRef.update({
      contentStatus: 'rejected',
      rejectionReason,
      contentRejectedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting content:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', '?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');
  }
});
