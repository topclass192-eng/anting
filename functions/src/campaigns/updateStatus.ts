import * as functions from 'firebase-functions';
import { handleError } from '../utils/errors';
import type { CampaignStatus } from '../types';

interface UpdateStatusRequest {
  campaignId: string;
  status: CampaignStatus;
}

export const updateStatus = functions.https.onCall(async (data: UpdateStatusRequest, context) => {
  try {
    // 빈 함수 구조
    return { success: true, message: 'updateStatus called' };
  } catch (error) {
    return handleError(error);
  }
});
