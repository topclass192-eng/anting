"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmDelivery = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.confirmDelivery = functions.region('asia-northeast3').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그?�이 ?�요???�비?�입?�다.');
    }
    const { applicationId } = data;
    if (!applicationId) {
        throw new functions.https.HttpsError('invalid-argument', '?�못???�청?�니??');
    }
    const db = admin.firestore();
    try {
        const appRef = db.collection('applications').doc(applicationId);
        const appSnap = await appRef.get();
        if (!appSnap.exists) {
            throw new functions.https.HttpsError('not-found', '?�청 ?�역??찾을 ???�습?�다.');
        }
        const appData = appSnap.data();
        if (appData.influencerId !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', '본인???�청 ?�역�??�정?????�습?�다.');
        }
        if (appData.status !== 'selected') {
            throw new functions.https.HttpsError('failed-precondition', '?�령 ?�인???????�는 ?�태?�니??');
        }
        if (!appData.trackingNumber) {
            throw new functions.https.HttpsError('failed-precondition', '?�송???�보가 ?�직 ?�록?��? ?�았?�니??');
        }
        await appRef.update({
            contentStatus: 'writing', // Status changes to 'writing' (콘텐�??�성 �?
            deliveryConfirmedAt: new Date().toISOString()
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error confirming delivery:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', '?�령 ?�인 �??�류가 발생?�습?�다.');
    }
});
//# sourceMappingURL=confirmDelivery.js.map