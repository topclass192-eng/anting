"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitContent = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.submitContent = functions.region('asia-northeast3').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그?�이 ?�요???�비?�입?�다.');
    }
    const { applicationId, contentUrl, platform } = data;
    if (!applicationId || !contentUrl || !platform) {
        throw new functions.https.HttpsError('invalid-argument', '?�못???�청?�니?? ?�수 값이 ?�락?�었?�니??');
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
        if (appData.contentStatus !== 'writing' && appData.contentStatus !== 'submitted' && appData.contentStatus !== 'rejected') {
            throw new functions.https.HttpsError('failed-precondition', '콘텐츠�? ?�출?????�는 ?�태?�니??');
        }
        const currentCount = appData.submissionCount || 0;
        if (currentCount >= 3) {
            throw new functions.https.HttpsError('failed-precondition', '?�출 ?�수(3??�?초과?�여 ???�상 ?�출?????�습?�다.');
        }
        await appRef.update({
            contentStatus: 'submitted',
            contentUrl,
            platform,
            submissionCount: currentCount + 1,
            contentSubmittedAt: new Date().toISOString()
        });
        return { success: true };
    }
    catch (error) {
        console.error('Error submitting content:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', '콘텐�??�출 �??�류가 발생?�습?�다.');
    }
});
//# sourceMappingURL=submitContent.js.map