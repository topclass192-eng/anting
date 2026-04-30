import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const selectApplicant = functions.region('asia-northeast3').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'ë¡œê·¸?¸ì´ ?„ìš”???œë¹„?¤ì…?ˆë‹¤.'
    );
  }

  const { applicationId, action } = data; // action: 'selected' | 'rejected'

  if (!applicationId || !['selected', 'rejected'].includes(action)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      '?˜ëª»???”ì²­?…ë‹ˆ??'
    );
  }

  const db = admin.firestore();

  try {
    await db.runTransaction(async (transaction) => {
      // 1. Get Application
      const applicationRef = db.collection('applications').doc(applicationId);
      const applicationSnap = await transaction.get(applicationRef);

      if (!applicationSnap.exists) {
        throw new functions.https.HttpsError('not-found', '?´ë‹¹ ì§€???´ì—­??ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
      }

      const applicationData = applicationSnap.data()!;
      
      // If the application is already in the target state, do nothing
      if (applicationData.status === action) {
        return;
      }

      // 2. Get Campaign
      const campaignRef = db.collection('campaigns').doc(applicationData.campaignId);
      const campaignSnap = await transaction.get(campaignRef);

      if (!campaignSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'ìº í˜?¸ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
      }

      const campaignData = campaignSnap.data()!;

      // 3. Security Check: Only the brand that owns the campaign can select applicants
      if (campaignData.brandId !== context.auth!.uid) {
        throw new functions.https.HttpsError('permission-denied', 'ê¶Œí•œ???†ìŠµ?ˆë‹¤.');
      }

      const currentRecruited = campaignData.recruitedCount || 0;
      const targetRecruitment = campaignData.participants || 0;

      // 4. Selection Logic
      if (action === 'selected') {
        // If it wasn't selected before, and we are selecting it now
        if (applicationData.status !== 'selected') {
          if (currentRecruited >= targetRecruitment) {
            throw new functions.https.HttpsError('resource-exhausted', 'ëª¨ì§‘ ?¸ì›??ë§ˆê°?˜ì—ˆ?µë‹ˆ??');
          }
          // Increment recruitedCount
          transaction.update(campaignRef, {
            recruitedCount: currentRecruited + 1
          });
        }
      } else if (action === 'rejected') {
        // If it was selected before, and now we are rejecting it, we should decrement recruitedCount
        if (applicationData.status === 'selected') {
          transaction.update(campaignRef, {
            recruitedCount: Math.max(0, currentRecruited - 1)
          });
        }
      }

      // 5. Update Application Status
      transaction.update(applicationRef, {
        status: action,
        updatedAt: new Date().toISOString()
      });
    });

    return { success: true, message: action === 'selected' ? '? ë°œ ì²˜ë¦¬?˜ì—ˆ?µë‹ˆ??' : '?ˆë½ ì²˜ë¦¬?˜ì—ˆ?µë‹ˆ??' };

  } catch (error) {
    console.error('Error selecting applicant:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      '?íƒœ ?…ë°?´íŠ¸ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.'
    );
  }
});
