"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectApplicant = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
exports.selectApplicant = functions.region('asia-northeast3').https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그?�이 ?�요???�비?�입?�다.');
    }
    const { applicationId, action } = data; // action: 'selected' | 'rejected'
    if (!applicationId || !['selected', 'rejected'].includes(action)) {
        throw new functions.https.HttpsError('invalid-argument', '?�못???�청?�니??');
    }
    const db = admin.firestore();
    try {
        await db.runTransaction(async (transaction) => {
            // 1. Get Application
            const applicationRef = db.collection('applications').doc(applicationId);
            const applicationSnap = await transaction.get(applicationRef);
            if (!applicationSnap.exists) {
                throw new functions.https.HttpsError('not-found', '?�당 지???�역??찾을 ???�습?�다.');
            }
            const applicationData = applicationSnap.data();
            // If the application is already in the target state, do nothing
            if (applicationData.status === action) {
                return;
            }
            // 2. Get Campaign
            const campaignRef = db.collection('campaigns').doc(applicationData.campaignId);
            const campaignSnap = await transaction.get(campaignRef);
            if (!campaignSnap.exists) {
                throw new functions.https.HttpsError('not-found', '캠페?�을 찾을 ???�습?�다.');
            }
            const campaignData = campaignSnap.data();
            // 3. Security Check: Only the brand that owns the campaign can select applicants
            if (campaignData.brandId !== context.auth.uid) {
                throw new functions.https.HttpsError('permission-denied', '권한???�습?�다.');
            }
            const currentRecruited = campaignData.recruitedCount || 0;
            const targetRecruitment = campaignData.participants || 0;
            // 4. Selection Logic
            if (action === 'selected') {
                // If it wasn't selected before, and we are selecting it now
                if (applicationData.status !== 'selected') {
                    if (currentRecruited >= targetRecruitment) {
                        throw new functions.https.HttpsError('resource-exhausted', '모집 ?�원??마감?�었?�니??');
                    }
                    // Increment recruitedCount
                    transaction.update(campaignRef, {
                        recruitedCount: currentRecruited + 1
                    });
                }
            }
            else if (action === 'rejected') {
                // If it was selected before, and now we are rejecting it, we should decrement recruitedCount
                if (applicationData.status === 'selected') {
                    transaction.update(campaignRef, {
                        recruitedCount: Math.max(0, currentRecruited - 1)
                    });
                }
            }
            // 5. Update Application Status
            transaction.update(applicationRef, {
                status: action,
                updatedAt: new Date().toISOString()
            });
        });
        return { success: true, message: action === 'selected' ? '?�발 처리?�었?�니??' : '?�락 처리?�었?�니??' };
    }
    catch (error) {
        console.error('Error selecting applicant:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', '?�태 ?�데?�트 �??�류가 발생?�습?�다.');
    }
});
//# sourceMappingURL=selectApplicant.js.map