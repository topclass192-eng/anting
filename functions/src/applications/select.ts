import * as functions from 'firebase-functions';
import { handleError } from '../utils/errors';
import type { ApplicationStatus } from '../types';

interface SelectRequest {
  applicationId: string;
  status: ApplicationStatus;
}

export const select = functions.https.onCall(async (data: SelectRequest, context) => {
  try {
    // 빈 함수 구조
    return { success: true, message: 'select called' };
  } catch (error) {
    return handleError(error);
  }
});
