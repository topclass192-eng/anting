"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRole = exports.verifyAuth = void 0;
const functions = require("firebase-functions");
const verifyAuth = (req) => {
    if (!req.auth || !req.auth.uid) {
        throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }
    return req.auth;
};
exports.verifyAuth = verifyAuth;
const verifyRole = (req, allowedRole) => {
    const auth = (0, exports.verifyAuth)(req);
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
exports.verifyRole = verifyRole;
//# sourceMappingURL=auth.js.map