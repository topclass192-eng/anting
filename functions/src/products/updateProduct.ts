import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { validateProductInput } from '../utils/validators';

export const updateProduct = onCall(async (request) => {
  const { auth, data } = request;

  if (!auth || !auth.uid) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  if (auth.token.role !== 'brand') {
    throw new HttpsError('permission-denied', '브랜드 계정만 제품을 수정할 수 있습니다.');
  }

  const productId = data.productId;
  if (!productId) {
    throw new HttpsError('invalid-argument', '제품 ID가 누락되었습니다.');
  }

  try {
    validateProductInput(data);
  } catch (error: any) {
    throw new HttpsError(error.code || 'invalid-argument', error.message || '잘못된 입력입니다.');
  }

  try {
    const db = admin.firestore();
    const productRef = db.collection('products').doc(productId);
    
    const doc = await productRef.get();
    if (!doc.exists) {
      throw new HttpsError('not-found', '제품을 찾을 수 없습니다.');
    }
    
    if (doc.data()?.brandId !== auth.uid) {
      throw new HttpsError('permission-denied', '자신의 제품만 수정할 수 있습니다.');
    }

    if (doc.data()?.status === 'deleted') {
      throw new HttpsError('failed-precondition', '삭제된 제품은 수정할 수 없습니다.');
    }
    
    await productRef.update({
      name: data.name,
      category: data.category,
      description: data.description,
      price: data.price,
      images: data.images,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('제품 수정 실패:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', '제품 수정에 실패했습니다.');
  }
});
