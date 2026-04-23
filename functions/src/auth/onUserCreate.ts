import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { handleError } from '../utils/errors';
import type { IUser } from '../types';

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(user.uid);

    const newUser: Partial<IUser> = {
      id: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role: null as any, // 초기값 미설정
      createdAt: admin.firestore.FieldValue.serverTimestamp() as any,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() as any,
    };

    await userRef.set(newUser);
    functions.logger.info(`기본 유저 문서 생성 성공: ${user.uid}`);
  } catch (error) {
    functions.logger.error('onUserCreate 에러:', handleError(error));
  }
});
