"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectContent = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.rejectContent = functions.region('asia-northeast3').https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그?�이 ?�요???�비?�입?�다.');
    }
    const { applicationId, campaignId, rejectionReason } = data;
    if (!applicationId || !campaignId || !rejectionReason) {
        throw new functions.https.HttpsError('invalid-argument', '?�못???�청?�니??');
    }
    if (rejectionReason.length > 200) {
        throw new functions.https.HttpsError('invalid-argument', '반려 ?�유??200???�내?�야 ?�니??');
    }
    const db = admin.firestore();
    try {
        // 1. Security Check
        const campaignRef = db.collection('campaigns').doc(campaignId);
        const campaignSnap = await campaignRef.get();
        if (!campaignSnap.exists) {
            throw new functions.https.HttpsError('not-found', '캠페?�을 찾을 ???�습?�다.');
        }
        if (((_a = campaignSnap.data()) === null || _a === void 0 ? void 0 : _a.brandId) !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', '권한???�습?�다.');
        }
        // 2. Reject Application
        const appRef = db.collection('applications').doc(applicationId);
        await appRef.update({
            contentStatus: 'rejected',
            rejectionReason,
            contentRejectedAt: new Date().toISOString()
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error rejecting content:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', '?�류가 발생?�습?�다.');
    }
});
//# sourceMappingURL=rejectContent.js.map