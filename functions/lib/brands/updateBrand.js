"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBrand = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const validators_1 = require("../utils/validators");
exports.updateBrand = (0, https_1.onCall)(async (request) => {
    const { auth, data } = request;
    // 1. 인증 확인
    if (!auth || !auth.uid) {
        throw new https_1.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    const uid = auth.uid;
    // 2. 권한 확인 (사용자가 brand인지 검증) - optional but recommended
    if (auth.token.role !== 'brand') {
        throw new https_1.HttpsError('permission-denied', '브랜드 계정만 접근 가능합니다.');
    }
    // 3. 입력값 검증
    try {
        (0, validators_1.validateBrandProfile)(data);
    }
    catch (error) {
        // AppError 발생 시
        throw new https_1.HttpsError(error.code || 'invalid-argument', error.message || '잘못된 입력입니다.');
    }
    // 4. Firestore에 저장
    try {
        const db = admin.firestore();
        const brandRef = db.collection('brands').doc(uid);
        await brandRef.set({
            companyName: data.companyName,
            category: data.category,
            contactName: data.contactName,
            contactPhone: data.contactPhone,
            description: data.description || '',
            logoUrl: data.logoUrl || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return {
            success: true,
            message: '프로필이 저장되었습니다.'
        };
    }
    catch (error) {
        console.error('브랜드 프로필 저장 실패:', error);
        throw new https_1.HttpsError('internal', '프로필 저장에 실패했습니다. 다시 시도해 주세요.');
    }
});
//# sourceMappingURL=updateBrand.js.map