import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuth } from '../utils/auth';
import type { IUser } from '../types';

interface SetRoleRequest {
  userId: string;
  role: string;
}

export const setUserRole = functions.region('asia-northeast3').https.onCall(async (data: SetRoleRequest, req) => {
  try {
    const auth = verifyAuth(req);
    const { userId, role } = data;

    const allowedRoles = ['brand', 'influencer', 'shopper', 'admin'];
    if (!allowedRoles.includes(role)) {
      throw new functions.https.HttpsError('invalid-argument', '잘못된 역할(role)입니다.');
    }

    // Only allow setting your own role or if admin
    if (auth.uid !== userId && auth.token.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', '접근 권한이 없습니다.');
    }

    const setClaimsReq = admin.auth().setCustomUserClaims(userId, { role });
    
    // Update firestore document
    const updateDbReq = admin.firestore().collection('users').doc(userId).update({
      role,
      updatedAt: FieldValue.serverTimestamp() as unknown as IUser['updatedAt']
    });

    await Promise.all([setClaimsReq, updateDbReq]);

    return { success: true, message: '역할이 성공적으로 설정되었습니다.' };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message || '역할 설정 중 오류가 발생했습니다.');
  }
});
