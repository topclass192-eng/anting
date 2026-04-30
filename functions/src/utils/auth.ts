import * as functions from 'firebase-functions';

export const verifyAuth = (req: functions.https.CallableContext) => {
  if (!req.auth || !req.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
  }
  return req.auth;
};

export const verifyRole = (req: functions.https.CallableContext, allowedRole: string | string[]) => {
  const auth = verifyAuth(req);
  const userRole = auth.token.role;
  
  if (!userRole) {
    throw new functions.https.HttpsError('permission-denied', '접근 권한이 없습니다.');
  }

  const isAllowed = Array.isArray(allowedRole) 
    ? allowedRole.includes(userRole) 
    : userRole === allowedRole;

  if (!isAllowed) {
    throw new functions.https.HttpsError('permission-denied', '접근 권한이 없습니다.');
  }

  return auth;
};
