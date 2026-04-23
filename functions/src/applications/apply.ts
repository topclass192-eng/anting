import * as functions from 'firebase-functions';
import { handleError } from '../utils/errors';
import type { IApplication } from '../types';

export const apply = functions.https.onCall(async (data: Partial<IApplication>, context) => {
  try {
    // 빈 함수 구조
    return { success: true, message: 'apply called' };
  } catch (error) {
    return handleError(error);
  }
});
