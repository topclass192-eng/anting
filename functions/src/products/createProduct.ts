import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { validateProductInput } from '../utils/validators';

export const createProduct = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  if (auth.token.role !== 'brand') {
    throw new HttpsError('permission-denied', '브랜드 계정만 제품을 등록할 수 있습니다.');
  }

  try {
    validateProductInput(data);
  } catch (error: any) {
    throw new HttpsError(error.code || 'invalid-argument', error.message || '잘못된 입력입니다.');
  }

  try {
    const db = admin.firestore();
    const productId = data.productId; // Frontend generated ID
    
    if (!productId) {
      throw new HttpsError('invalid-argument', '제품 ID가 누락되었습니다.');
    }

    const productRef = db.collection('products').doc(productId);
    
    await productRef.set({
      brandId: auth.uid,
      name: data.name,
      category: data.category,
      description: data.description,
      price: data.price,
      images: data.images,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      productId
    };
  } catch (error) {
    console.error('제품 생성 실패:', error);
    throw new HttpsError('internal', '제품 등록에 실패했습니다.');
  }
});
