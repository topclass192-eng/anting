import * as functions from 'firebase-functions';
import { getFirestore, Query } from 'firebase-admin/firestore';
import { handleError } from '../utils/errors';

interface GetCampaignsRequest {
  category?: string;
  region?: string;
  platform?: string;
  lastVisibleId?: string;
  pageSize?: number;
}

export const getCampaigns = functions.region('asia-northeast3').https.onCall(async (data: GetCampaignsRequest, context) => {
  try {
    const db = getFirestore();
    const pageSize = data.pageSize || 10;
    
    // Base query: active campaigns
    let campaignsQuery: Query = db.collection('campaigns').where('status', '==', 'active');

    if (data.category && data.category !== '전체') {
      // Assuming productCategory exists on campaign or category exists.
      // Day 13 CampaignRegistration had: product selection. But wait, where is category stored?
      // Assuming campaign document has 'category' or we just filter it.
      campaignsQuery = campaignsQuery.where('category', '==', data.category);
    }

    if (data.region && data.region !== '전체') {
      // region is array in campaign? Day 13 says: 지역 조건 (멀티셀렉트: 전국/서울/경기...)
      campaignsQuery = campaignsQuery.where('regions', 'array-contains', data.region);
    }

    if (data.platform) {
      // platforms is array in campaign? Day 13 says: 진행 플랫폼 (체크박스: 인스타그램/네이버 블로그/틱톡)
      campaignsQuery = campaignsQuery.where('platforms', 'array-contains', data.platform);
    }

    // Default sorting
    // NOTE: Using multiple where conditions with orderBy requires Composite Indexes in Firestore.
    // If an index error occurs, the Firebase console link should be used to create it.
    campaignsQuery = campaignsQuery.orderBy('createdAt', 'desc');

    if (data.lastVisibleId) {
      const lastDoc = await db.collection('campaigns').doc(data.lastVisibleId).get();
      if (lastDoc.exists) {
        campaignsQuery = campaignsQuery.startAfter(lastDoc);
      }
    }

    campaignsQuery = campaignsQuery.limit(pageSize);

    const snapshot = await campaignsQuery.get();
    
    const campaigns = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null;
    const hasMore = snapshot.docs.length === pageSize;

    return { 
      success: true, 
      data: {
        campaigns,
        lastVisible,
        hasMore
      }
    };
  } catch (error) {
    functions.logger.error('Error fetching campaigns:', error);
    return handleError(error);
  }
});
