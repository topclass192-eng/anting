import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const approveContent = functions.region('asia-northeast3').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그?�이 ?�요???�비?�입?�다.');
  }

  const { applicationId, campaignId } = data;

  if (!applicationId || !campaignId) {
    throw new functions.https.HttpsError('invalid-argument', '?�못???�청?�니??');
  }

  const db = admin.firestore();

  try {
    // 1. Security Check
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      throw new functions.https.HttpsError('not-found', '캠페?�을 찾을 ???�습?�다.');
    }

    if (campaignSnap.data()?.brandId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', '권한???�습?�다.');
    }

    // 2. Approve Application
    const appRef = db.collection('applications').doc(applicationId);
    await appRef.update({
      contentStatus: 'approved',
      contentApprovedAt: new Date().toISOString()
    });

    // 3. Check if all selected applicants are approved
    const appsSnap = await db.collection('applications')
      .where('campaignId', '==', campaignId)
      .where('status', '==', 'selected')
      .get();

    let allApproved = true;
    for (const docSnap of appsSnap.docs) {
      if (docSnap.data().contentStatus !== 'approved') {
        allApproved = false;
        break;
      }
    }

    // If all are approved, mark campaign as completed and process settlement
    if (allApproved && appsSnap.size > 0) {
      const batch = db.batch();
      
      batch.update(campaignRef, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      const paybackPrice = campaignSnap.data()?.paybackPrice || 0;

      if (paybackPrice > 0) {
        for (const docSnap of appsSnap.docs) {
          const appData = docSnap.data();
          const influencerRef = db.collection('influencers').doc(appData.uid);
          
          batch.update(influencerRef, {
            points: admin.firestore.FieldValue.increment(paybackPrice),
            payback: admin.firestore.FieldValue.increment(paybackPrice)
          });

          const txRef = db.collection('transactions').doc();
          batch.set(txRef, {
            userId: appData.uid,
            type: 'earn',
            amount: paybackPrice,
            campaignId: campaignId,
            campaignName: campaignSnap.data()?.name || 'campaign',
            description: 'reward',
            createdAt: new Date().toISOString()
          });
        }
      }

      await batch.commit();
    }

    return { success: true, allApproved };
  } catch (error) {
    console.error('Error approving content:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', '?�류가 발생?�습?�다.');
  }
});
