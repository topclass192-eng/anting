import * as functions from 'firebase-functions';
import { handleError } from '../utils/errors';
import type { ICampaign } from '../types';

export const createCampaign = functions.https.onCall(async (data: Partial<ICampaign>, context) => {
  try {
    // 빈 함수 구조
    return { success: true, message: 'createCampaign called' };
  } catch (error) {
    return handleError(error);
  }
});
