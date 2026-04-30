"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateShipping = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.updateShipping = functions.region('asia-northeast3').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그?�이 ?�요???�비?�입?�다.');
    }
    // Expecting an array of shipping updates
    // updates: [{ applicationId: string, shippingCompany: string, trackingNumber: string }]
    const { campaignId, updates } = data;
    if (!campaignId || !updates || !Array.isArray(updates)) {
        throw new functions.https.HttpsError('invalid-argument', '?�못???�청?�니??');
    }
    const db = admin.firestore();
    try {
        // 1. Security Check: Ensure the user is the owner of the campaign
        const campaignRef = db.collection('campaigns').doc(campaignId);
        const campaignSnap = await campaignRef.get();
        if (!campaignSnap.exists) {
            throw new functions.https.HttpsError('not-found', '캠페?�을 찾을 ???�습?�다.');
        }
        const campaignData = campaignSnap.data();
        if (campaignData.brandId !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', '?�당 캠페?�의 ?�송?�을 ?�데?�트??권한???�습?�다.');
        }
        // 2. Perform Batch Update
        const batch = db.batch();
        // To avoid too large batches, limit to 500 (Firestore limit)
        // For normal usage, it should be way below 500.
        const limitedUpdates = updates.slice(0, 500);
        for (const update of limitedUpdates) {
            const { applicationId, shippingCompany, trackingNumber } = update;
            if (!applicationId || !shippingCompany || !trackingNumber)
                continue;
            const appRef = db.collection('applications').doc(applicationId);
            batch.update(appRef, {
                shippingCompany,
                trackingNumber,
                shippingUpdatedAt: new Date().toISOString()
            });
        }
        await batch.commit();
        return { success: true, processedCount: limitedUpdates.length };
    }
    catch (error) {
        console.error('Error updating shipping info:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', '?�송???�데?�트 �??�류가 발생?�습?�다.');
    }
});
//# sourceMappingURL=updateShipping.js.map