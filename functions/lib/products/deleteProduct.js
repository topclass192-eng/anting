"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
exports.deleteProduct = (0, https_1.onCall)(async (request) => {
    var _a;
    const { auth, data } = request;
    if (!auth || !auth.uid) {
        throw new https_1.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    if (auth.token.role !== 'brand') {
        throw new https_1.HttpsError('permission-denied', '브랜드 계정만 제품을 삭제할 수 있습니다.');
    }
    const productId = data.productId;
    if (!productId) {
        throw new https_1.HttpsError('invalid-argument', '제품 ID가 누락되었습니다.');
    }
    try {
        const db = admin.firestore();
        const productRef = db.collection('products').doc(productId);
        const doc = await productRef.get();
        if (!doc.exists) {
            throw new https_1.HttpsError('not-found', '제품을 찾을 수 없습니다.');
        }
        if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.brandId) !== auth.uid) {
            throw new https_1.HttpsError('permission-denied', '자신의 제품만 삭제할 수 있습니다.');
        }
        // Soft delete
        await productRef.update({
            status: 'deleted',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        console.error('제품 삭제 실패:', error);
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', '제품 삭제에 실패했습니다.');
    }
});
//# sourceMappingURL=deleteProduct.js.map