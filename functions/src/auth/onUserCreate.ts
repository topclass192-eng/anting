import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
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
      role: null as unknown as IUser['role'],
      onboardingStep: 0,
      createdAt: FieldValue.serverTimestamp() as unknown as IUser['createdAt'],
      updatedAt: FieldValue.serverTimestamp() as unknown as IUser['updatedAt'],
    };

    await userRef.set(newUser);
    functions.logger.info(`기본 유저 문서 생성 성공: ${user.uid}`);
  } catch (error) {
    functions.logger.error('onUserCreate 에러:', handleError(error));
  }
});
