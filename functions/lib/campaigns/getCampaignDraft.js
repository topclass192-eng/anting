"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCampaignDraft = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
exports.getCampaignDraft = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const { auth } = request;
    if (!auth || !auth.uid) {
        throw new https_1.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    if (auth.token.role !== 'brand') {
        throw new https_1.HttpsError('permission-denied', '브랜드 계정만 캠페인을 조회할 수 있습니다.');
    }
    try {
        const db = admin.firestore();
        const querySnapshot = await db.collection('campaigns')
            .where('brandId', '==', auth.uid)
            .where('status', '==', 'draft')
            .orderBy('updatedAt', 'desc')
            .limit(1)
            .get();
        if (querySnapshot.empty) {
            return { success: true, draft: null };
        }
        const doc = querySnapshot.docs[0];
        const draftData = doc.data();
        return {
            success: true,
            draft: Object.assign(Object.assign({ id: doc.id }, draftData), { createdAt: ((_a = draftData.createdAt) === null || _a === void 0 ? void 0 : _a.toMillis()) || Date.now(), updatedAt: ((_b = draftData.updatedAt) === null || _b === void 0 ? void 0 : _b.toMillis()) || Date.now() })
        };
    }
    catch (error) {
        console.error('드래프트 조회 실패:', error);
        throw new https_1.HttpsError('internal', '임시 저장 데이터를 불러오는 데 실패했습니다.');
    }
});
//# sourceMappingURL=getCampaignDraft.js.map