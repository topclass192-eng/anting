import * as functions from 'firebase-functions';
import { handleError } from '../utils/errors';
import type { Role } from '../types';

interface SetRoleRequest {
  role: Role;
}

export const setRole = functions.https.onCall(async (data: SetRoleRequest, context) => {
  try {
    // 빈 함수 구조
    return { success: true, message: 'setRole called' };
  } catch (error) {
    return handleError(error);
  }
});
