"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserRole = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../utils/auth");
exports.setUserRole = functions.region('asia-northeast3').https.onCall(async (data, req) => {
    try {
        const auth = (0, auth_1.verifyAuth)(req);
        const { userId, role } = data;
        const allowedRoles = ['brand', 'influencer', 'shopper', 'admin'];
        if (!allowedRoles.includes(role)) {
            throw new functions.https.HttpsError('invalid-argument', '잘못된 역할(role)입니다.');
        }
        // Only allow setting your own role or if admin
        if (auth.uid !== userId && auth.token.role !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', '접근 권한이 없습니다.');
        }
        const setClaimsReq = admin.auth().setCustomUserClaims(userId, { role });
        // Update firestore document
        const updateDbReq = admin.firestore().collection('users').doc(userId).update({
            role,
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        });
        await Promise.all([setClaimsReq, updateDbReq]);
        return { success: true, message: '역할이 성공적으로 설정되었습니다.' };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || '역할 설정 중 오류가 발생했습니다.');
    }
});
//# sourceMappingURL=setRole.js.map