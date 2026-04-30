import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Get applications for a specific campaign, joined with influencer data
export const getApplications = functions.region('asia-northeast3').https.onCall(async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'ë¡œê·¸?¸ì´ ?„ìš”???œë¹„?¤ì…?ˆë‹¤.'
    );
  }

  const { campaignId, status, followerMin = 0, followerMax = 1000000, category, tier } = data;

  if (!campaignId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'ìº í˜??IDê°€ ?„ìš”?©ë‹ˆ??'
    );
  }

  const db = admin.firestore();

  try {
    // 1. Check if the user is the owner of the campaign (Brand)
    const campaignRef = db.collection('campaigns').doc(campaignId);
    const campaignSnap = await campaignRef.get();

    if (!campaignSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'ìº í˜?¸ì„ ì°¾ì„ ???†ìŠµ?ˆë‹¤.');
    }

    const campaignData = campaignSnap.data();
    if (campaignData?.brandId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', '?´ë‹¹ ìº í˜?¸ì˜ ì§€?ìë¥?ì¡°íšŒ??ê¶Œí•œ???†ìŠµ?ˆë‹¤.');
    }

    // 2. Fetch applications
    let applicationsQuery: admin.firestore.Query = db.collection('applications')
      .where('campaignId', '==', campaignId);
    
    if (status) {
      applicationsQuery = applicationsQuery.where('status', '==', status);
    }
    
    // Ordered by appliedAt
    applicationsQuery = applicationsQuery.orderBy('appliedAt', 'desc');

    const applicationsSnap = await applicationsQuery.get();
    
    if (applicationsSnap.empty) {
      return { applications: [] };
    }

    // 3. Fetch influencer details in parallel
    const influencerPromises = applicationsSnap.docs.map(async (appDoc) => {
      const appData = appDoc.data();
      const influencerRef = db.collection('influencers').doc(appData.uid);
      const influencerSnap = await influencerRef.get();
      
      const influencerData = influencerSnap.exists ? influencerSnap.data() : null;
      
      return {
        id: appDoc.id,
        ...appData,
        appliedAt: appData.appliedAt?.toDate()?.toISOString(),
        influencer: influencerData ? {
          nickname: influencerData.nickname,
          profileImage: influencerData.profileImage,
          tier: influencerData.tier || 'BRONZE',
          categories: influencerData.categories || [],
          channels: influencerData.channels || {},
          // Compute total followers across connected channels
          totalFollowers: Object.values(influencerData.channels || {}).reduce((sum: number, channel: any) => sum + (Number(channel.followers) || 0), 0)
        } : null
      };
    });

    let results = await Promise.all(influencerPromises);

    // 4. Memory/Server Filtering based on Influencer data
    results = results.filter((item) => {
      if (!item.influencer) return false;
      
      const inf = item.influencer;
      
      // Filter by Follower count
      if (inf.totalFollowers < followerMin || inf.totalFollowers > followerMax) {
        return false;
      }
      
      // Filter by Category
      if (category && category !== '?„ì²´') {
        if (!inf.categories.includes(category)) {
          return false;
        }
      }
      
      // Filter by Tier
      if (tier && tier !== '?„ì²´') {
        if (inf.tier !== tier) {
          return false;
        }
      }
      
      return true;
    });

    return { applications: results };

  } catch (error) {
    console.error('Error fetching applications:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      '? ì²­??ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.'
    );
  }
});
