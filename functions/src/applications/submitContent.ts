import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const submitContent = functions.region('asia-northeast3').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'ë¡œê·¸?¸ì´ ?„ìš”???œë¹„?¤ì…?ˆë‹¤.'
    );
  }

  const { applicationId, contentUrl, platform } = data;

  if (!applicationId || !contentUrl || !platform) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      '?˜ëª»???”ì²­?…ë‹ˆ?? ?„ìˆ˜ ê°’ì´ ?„ë½?˜ì—ˆ?µë‹ˆ??'
    );
  }

  const db = admin.firestore();

  try {
    const appRef = db.collection('applications').doc(applicationId);
    const appSnap = await appRef.get();

    if (!appSnap.exists) {
      throw new functions.https.HttpsError('not-found', '? ì²­ ?´ì—­??ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
    }

    const appData = appSnap.data()!;
    if (appData.influencerId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'ë³¸ì¸??? ì²­ ?´ì—­ë§??˜ì •?????ˆìŠµ?ˆë‹¤.');
    }

    if (appData.contentStatus !== 'writing' && appData.contentStatus !== 'submitted' && appData.contentStatus !== 'rejected') {
      throw new functions.https.HttpsError('failed-precondition', 'ì½˜í…ì¸ ë? ?œì¶œ?????†ëŠ” ?íƒœ?…ë‹ˆ??');
    }

    const currentCount = appData.submissionCount || 0;
    if (currentCount >= 3) {
      throw new functions.https.HttpsError('failed-precondition', '?œì¶œ ?Ÿìˆ˜(3??ë¥?ì´ˆê³¼?˜ì—¬ ???´ìƒ ?œì¶œ?????†ìŠµ?ˆë‹¤.');
    }

    await appRef.update({
      contentStatus: 'submitted',
      contentUrl,
      platform,
      submissionCount: currentCount + 1,
      contentSubmittedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error submitting content:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      'ì½˜í…ì¸??œì¶œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.'
    );
  }
});
