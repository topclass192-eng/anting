import * as functions from 'firebase-functions';
import { handleError } from '../utils/errors';
import type { Role } from '../types';

interface SetRoleRequest {
  role: Role;
}

export const setRole = functions.https.onCall(async (_data: SetRoleRequest, _context) => {
  try {
    return { success: true, message: 'setRole called' };
  } catch (error) {
    return handleError(error);
  }
});
