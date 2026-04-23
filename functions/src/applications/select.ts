import * as functions from 'firebase-functions';
import { handleError } from '../utils/errors';
import type { ApplicationStatus } from '../types';

interface SelectRequest {
  applicationId: string;
  status: ApplicationStatus;
}

export const select = functions.https.onCall(async (_data: SelectRequest, _context) => {
  try {
    return { success: true, message: 'select called' };
  } catch (error) {
    return handleError(error);
  }
});
