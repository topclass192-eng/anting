"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apply = void 0;
const functions = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
const errors_1 = require("../utils/errors");
exports.apply = functions.region('asia-northeast3').https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', '로그?�이 ?�요?�니??');
        }
        const { campaignId } = data;
        if (!campaignId) {
            throw new functions.https.HttpsError('invalid-argument', '캠페??ID가 ?�요?�니??');
        }
        console.log("APPLYING TO CAMPAIGN ID:", campaignId);
        const uid = context.auth.uid;
        const db = (0, firestore_1.getFirestore)();
        const result = await db.runTransaction(async (transaction) => {
            const campaignRef = db.collection('campaigns').doc(campaignId);
            const applicationsQuery = db.collection('applications')
                .where('campaignId', '==', campaignId)
                .where('influencerId', '==', uid);
            const campaignDoc = await transaction.get(campaignRef);
            if (!campaignDoc.exists) {
                throw new functions.https.HttpsError('not-found', '캠페?�을 찾을 ???�습?�다.');
            }
            // 1. 중복 ?�청 방�? (Transaction ?�에??쿼리�??�려�?get()???�용. 
            // Firestore ?�랜??��?�서 Query get()?� ?�랜??�� 충돌 검?�에 ?�함?��? ?�으??리더 ??��?� ??
            const existingApps = await transaction.get(applicationsQuery);
            if (!existingApps.empty) {
                throw new Error('?��? ?�청??캠페?�입?�다.');
            }
            const campaignData = campaignDoc.data();
            if (!campaignData) {
                throw new functions.https.HttpsError('internal', '캠페???�이???�류');
            }
            // 2. 마감 ?��? ?�인
            const now = new Date();
            const deadline = new Date(campaignData.deadline);
            // set deadline to end of day for comparison
            deadline.setHours(23, 59, 59, 999);
            if (now.getTime() > deadline.getTime() || campaignData.status !== 'active') {
                throw new Error('?��? 마감??캠페?�입?�다.');
            }
            // 3. 모집 ?�원 초과 ?��? ?�인
            const currentApplicants = campaignData.currentApplicants || 0;
            const recruitmentCount = campaignData.participants || 0;
            if (currentApplicants >= recruitmentCount) {
                throw new Error('모집 ?�원??초과?�었?�니??');
            }
            // 4. applications 컬렉??문서 ?�성
            const newAppRef = db.collection('applications').doc();
            transaction.set(newAppRef, {
                campaignId,
                brandId: campaignData.brandId,
                influencerId: uid,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            // 5. currentApplicants 증�?
            transaction.update(campaignRef, {
                currentApplicants: currentApplicants + 1
            });
            return { success: true, message: '?�청???�료?�었?�니??', applicationId: newAppRef.id };
        });
        return result;
    }
    catch (error) {
        functions.logger.error('Error applying to campaign:', error);
        // return specifically the error message if it's our thrown Error, else standard handle
        if (error instanceof Error &&
            (error.message === '?��? ?�청??캠페?�입?�다.' ||
                error.message === '?��? 마감??캠페?�입?�다.' ||
                error.message === '모집 ?�원??초과?�었?�니??')) {
            return { error: true, message: error.message };
        }
        return (0, errors_1.handleError)(error);
    }
});
//# sourceMappingURL=apply.js.map