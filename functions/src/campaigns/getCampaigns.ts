import * as functions from 'firebase-functions';
import { handleError } from '../utils/errors';

export const getCampaigns = functions.https.onCall(async (data, context) => {
  try {
    // 빈 함수 구조
    return { success: true, data: [] };
  } catch (error) {
    return handleError(error);
  }
});
