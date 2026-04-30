import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { handleError } from '../utils/errors';

export const apply = functions.region('asia-northeast3').https.onCall(async (data: { campaignId: string }, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??');
    }

    const { campaignId } = data;
    if (!campaignId) {
      throw new functions.https.HttpsError('invalid-argument', 'ìº í˜??IDê°€ ?„ìš”?©ë‹ˆ??');
    }
    console.log("APPLYING TO CAMPAIGN ID:", campaignId);

    const uid = context.auth.uid;
    const db = getFirestore();

    const result = await db.runTransaction(async (transaction) => {
      const campaignRef = db.collection('campaigns').doc(campaignId);
      const applicationsQuery = db.collection('applications')
        .where('campaignId', '==', campaignId)
        .where('influencerId', '==', uid);
        
      const campaignDoc = await transaction.get(campaignRef);
      if (!campaignDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'ìº í˜?¸ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
      }

      // 1. ì¤‘ë³µ ? ì²­ ë°©ì? (Transaction ?´ì—??ì¿¼ë¦¬ë¥??˜ë ¤ë©?get()???¬ìš©. 
      // Firestore ?¸ëœ??…˜?ì„œ Query get()?€ ?¸ëœ??…˜ ì¶©ëŒ ê²€?¬ì— ?¬í•¨?˜ì? ?Šìœ¼??ë¦¬ë” ??• ?€ ??
      const existingApps = await transaction.get(applicationsQuery);
      if (!existingApps.empty) {
        throw new Error('?´ë? ? ì²­??ìº í˜?¸ì…?ˆë‹¤.');
      }

      const campaignData = campaignDoc.data();
      if (!campaignData) {
        throw new functions.https.HttpsError('internal', 'ìº í˜???°ì´???¤ë¥˜');
      }

      // 2. ë§ˆê° ?¬ë? ?•ì¸
      const now = new Date();
      const deadline = new Date(campaignData.deadline);
      // set deadline to end of day for comparison
      deadline.setHours(23, 59, 59, 999);
      if (now.getTime() > deadline.getTime() || campaignData.status !== 'active') {
        throw new Error('?´ë? ë§ˆê°??ìº í˜?¸ì…?ˆë‹¤.');
      }

      // 3. ëª¨ì§‘ ?¸ì› ì´ˆê³¼ ?¬ë? ?•ì¸
      const currentApplicants = campaignData.currentApplicants || 0;
      const recruitmentCount = campaignData.participants || 0;
      if (currentApplicants >= recruitmentCount) {
        throw new Error('ëª¨ì§‘ ?¸ì›??ì´ˆê³¼?˜ì—ˆ?µë‹ˆ??');
      }

      // 4. applications ì»¬ë ‰??ë¬¸ì„œ ?ì„±
      const newAppRef = db.collection('applications').doc();
      transaction.set(newAppRef, {
        campaignId,
        brandId: campaignData.brandId,
        influencerId: uid,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 5. currentApplicants ì¦ê?
      transaction.update(campaignRef, {
        currentApplicants: currentApplicants + 1
      });

      return { success: true, message: '? ì²­???„ë£Œ?˜ì—ˆ?µë‹ˆ??', applicationId: newAppRef.id };
    });

    return result;
  } catch (error: any) {
    functions.logger.error('Error applying to campaign:', error);
    // return specifically the error message if it's our thrown Error, else standard handle
    if (error instanceof Error && 
        (error.message === '?´ë? ? ì²­??ìº í˜?¸ì…?ˆë‹¤.' || 
         error.message === '?´ë? ë§ˆê°??ìº í˜?¸ì…?ˆë‹¤.' || 
         error.message === 'ëª¨ì§‘ ?¸ì›??ì´ˆê³¼?˜ì—ˆ?µë‹ˆ??')) {
      return { error: true, message: error.message };
    }
    return handleError(error);
  }
});
