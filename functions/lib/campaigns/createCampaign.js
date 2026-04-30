"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCampaign = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const validators_1 = require("../utils/validators");
exports.createCampaign = (0, https_1.onCall)({ region: 'asia-northeast3' }, async (request) => {
    var _a;
    const { auth, data } = request;
    if (!auth || !auth.uid) {
        throw new https_1.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    if (auth.token.role !== 'brand') {
        throw new https_1.HttpsError('permission-denied', '브랜드 계정만 캠페인을 등록할 수 있습니다.');
    }
    try {
        (0, validators_1.validateCampaignInput)(data);
    }
    catch (error) {
        throw new https_1.HttpsError(error.code || 'invalid-argument', error.message || '잘못된 입력입니다.');
    }
    try {
        const db = admin.firestore();
        let campaignId = data.campaignId;
        const payload = {
            name: data.name,
            productId: data.productId,
            participants: data.participants,
            regions: data.regions,
            platforms: data.platforms,
            deadline: data.deadline,
            requiredText: data.requiredText,
            forbiddenWords: data.forbiddenWords || [],
            hashtags: data.hashtags || [],
            referenceUrls: data.referenceUrls || [],
            brandId: auth.uid || 'fallback',
            status: 'active',
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        console.log("PAYLOAD TO WRITE:", JSON.stringify(Object.assign(Object.assign({}, payload), { updatedAt: "SERVER_TIMESTAMP" })));
        if (campaignId) {
            // Update existing draft
            const docRef = db.collection('campaigns').doc(campaignId);
            const doc = await docRef.get();
            if (!doc.exists) {
                throw new https_1.HttpsError('not-found', '캠페인을 찾을 수 없습니다.');
            }
            if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.brandId) !== auth.uid) {
                throw new https_1.HttpsError('permission-denied', '자신의 캠페인만 등록할 수 있습니다.');
            }
            await docRef.update(payload);
        }
        else {
            // Create new campaign
            const docRef = db.collection('campaigns').doc();
            campaignId = docRef.id;
            await docRef.set(Object.assign(Object.assign({}, payload), { createdAt: firestore_1.FieldValue.serverTimestamp() }));
        }
        return {
            success: true,
            campaignId,
            message: '캠페인이 등록되었습니다.'
        };
    }
    catch (error) {
        console.error('캠페인 등록 실패:', error);
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', '캠페인 등록에 실패했습니다.');
    }
});
//# sourceMappingURL=createCampaign.js.map