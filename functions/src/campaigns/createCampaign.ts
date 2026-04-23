import * as functions from 'firebase-functions';
import { handleError } from '../utils/errors';
import type { ICampaign } from '../types';

export const createCampaign = functions.https.onCall(async (_data: Partial<ICampaign>, _context) => {
  try {
    return { success: true, message: 'createCampaign called' };
  } catch (error) {
    return handleError(error);
  }
});
