"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCampaignDraft = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const validators_1 = require("../utils/validators");
exports.saveCampaignDraft = (0, https_1.onCall)(async (request) => {
    var _a;
    const { auth, data } = request;
    if (!auth || !auth.uid) {
        throw new https_1.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    if (auth.token.role !== 'brand') {
        throw new https_1.HttpsError('permission-denied', '브랜드 계정만 캠페인을 저장할 수 있습니다.');
    }
    try {
        (0, validators_1.validateCampaignDraft)(data);
    }
    catch (error) {
        throw new https_1.HttpsError(error.code || 'invalid-argument', error.message || '잘못된 입력입니다.');
    }
    try {
        const db = admin.firestore();
        let campaignId = data.campaignId;
        if (campaignId) {
            // 기존 드래프트 업데이트
            const docRef = db.collection('campaigns').doc(campaignId);
            const doc = await docRef.get();
            if (!doc.exists) {
                throw new https_1.HttpsError('not-found', '캠페인을 찾을 수 없습니다.');
            }
            if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.brandId) !== auth.uid) {
                throw new https_1.HttpsError('permission-denied', '자신의 캠페인만 수정할 수 있습니다.');
            }
            await docRef.update(Object.assign(Object.assign({}, data), { status: 'draft', updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        }
        else {
            // 새 드래프트 생성
            const docRef = db.collection('campaigns').doc();
            campaignId = docRef.id;
            await docRef.set(Object.assign(Object.assign({}, data), { brandId: auth.uid, status: 'draft', createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        }
        return { success: true, campaignId };
    }
    catch (error) {
        console.error('드래프트 저장 실패:', error);
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', '임시 저장에 실패했습니다.');
    }
});
//# sourceMappingURL=saveCampaignDraft.js.map