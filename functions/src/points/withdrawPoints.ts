import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const withdrawPoints = functions.region('asia-northeast3').https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요한 서비스입니다.');
  }

  const { amount, bankName, accountNumber, accountHolder } = data;

  if (!amount || amount < 10000) {
    throw new functions.https.HttpsError('invalid-argument', '최소 출금 가능 금액은 10,000원입니다.');
  }

  if (!bankName || !accountNumber || !accountHolder) {
    throw new functions.https.HttpsError('invalid-argument', '출금 계좌 정보를 모두 입력해주세요.');
  }

  const db = admin.firestore();
  const uid = context.auth.uid;

  try {
    const result = await db.runTransaction(async (transaction) => {
      const influencerRef = db.collection('influencers').doc(uid);
      const influencerDoc = await transaction.get(influencerRef);

      if (!influencerDoc.exists) {
        throw new functions.https.HttpsError('not-found', '사용자 정보를 찾을 수 없습니다.');
      }

      const currentPoints = influencerDoc.data()?.points || 0;

      if (currentPoints < amount) {
        throw new functions.https.HttpsError('failed-precondition', '보유 포인트가 부족합니다.');
      }

      // Deduct points
      transaction.update(influencerRef, {
        points: currentPoints - amount
      });

      // Create withdrawal request record
      const withdrawalRef = db.collection('withdrawals').doc();
      transaction.set(withdrawalRef, {
        userId: uid,
        amount,
        bankName,
        accountNumber,
        accountHolder,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create transaction record
      const txRef = db.collection('transactions').doc();
      transaction.set(txRef, {
        userId: uid,
        type: 'withdraw',
        amount: -amount,
        description: '포인트 출금 신청',
        withdrawalId: withdrawalRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return { success: true, withdrawalId: withdrawalRef.id };
    });

    return result;
  } catch (error) {
    console.error('Error withdrawing points:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', '출금 처리 중 오류가 발생했습니다.');
  }
});
