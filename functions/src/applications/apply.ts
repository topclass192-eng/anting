import * as functions from 'firebase-functions';
import { handleError } from '../utils/errors';
import type { IApplication } from '../types';

export const apply = functions.https.onCall(async (_data: Partial<IApplication>, _context) => {
  try {
    return { success: true, message: 'apply called' };
  } catch (error) {
    return handleError(error);
  }
});
