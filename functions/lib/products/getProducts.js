"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
exports.getProducts = (0, https_1.onCall)(async (request) => {
    const { auth, data } = request;
    if (!auth || !auth.uid) {
        throw new https_1.HttpsError('unauthenticated', '로그인이 필요합니다.');
    }
    if (auth.token.role !== 'brand') {
        throw new https_1.HttpsError('permission-denied', '브랜드 계정만 접근할 수 있습니다.');
    }
    try {
        const db = admin.firestore();
        const limitCount = data.limit || 10;
        const startAfterId = data.startAfter;
        let query = db.collection('products')
            .where('brandId', '==', auth.uid)
            .where('status', '!=', 'deleted')
            .orderBy('status') // To use inequality, we must order by status first
            .orderBy('createdAt', 'desc')
            .limit(limitCount);
        if (startAfterId) {
            const startAfterDoc = await db.collection('products').doc(startAfterId).get();
            if (startAfterDoc.exists) {
                query = query.startAfter(startAfterDoc);
            }
        }
        const snapshot = await query.get();
        const products = snapshot.docs.map(doc => {
            var _a, _b;
            return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: ((_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toMillis()) || Date.now(), updatedAt: ((_b = doc.data().updatedAt) === null || _b === void 0 ? void 0 : _b.toMillis()) || Date.now() }));
        });
        const lastVisibleId = snapshot.docs.length === limitCount ? snapshot.docs[snapshot.docs.length - 1].id : null;
        return {
            success: true,
            products,
            lastVisibleId
        };
    }
    catch (error) {
        console.error('제품 목록 조회 실패:', error);
        throw new https_1.HttpsError('internal', '제품 목록을 불러오는 데 실패했습니다.');
    }
});
//# sourceMappingURL=getProducts.js.map