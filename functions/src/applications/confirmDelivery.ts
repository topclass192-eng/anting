import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const confirmDelivery = functions.region('asia-northeast3').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'ë¡œê·¸?¸ì´ ?„ìš”???œë¹„?¤ì…?ˆë‹¤.'
    );
  }

  const { applicationId } = data;

  if (!applicationId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      '?˜ëª»???”ì²­?…ë‹ˆ??'
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

    if (appData.status !== 'selected') {
      throw new functions.https.HttpsError('failed-precondition', '?˜ë ¹ ?•ì¸???????†ëŠ” ?íƒœ?…ë‹ˆ??');
    }
    
    if (!appData.trackingNumber) {
      throw new functions.https.HttpsError('failed-precondition', '?´ì†¡???•ë³´ê°€ ?„ì§ ?±ë¡?˜ì? ?Šì•˜?µë‹ˆ??');
    }

    await appRef.update({
      contentStatus: 'writing', // Status changes to 'writing' (ì½˜í…ì¸??‘ì„± ì¤?
      deliveryConfirmedAt: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('Error confirming delivery:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      '?˜ë ¹ ?•ì¸ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.'
    );
  }
});
