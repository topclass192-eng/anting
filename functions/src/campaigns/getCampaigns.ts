import * as functions from 'firebase-functions';
import { handleError } from '../utils/errors';

export const getCampaigns = functions.https.onCall(async (_data, _context) => {
  try {
    return { success: true, data: [] };
  } catch (error) {
    return handleError(error);
  }
});
