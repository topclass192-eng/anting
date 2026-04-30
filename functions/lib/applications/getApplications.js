"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplications = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Get applications for a specific campaign, joined with influencer data
exports.getApplications = functions.region('asia-northeast3').https.onCall(async (data, context) => {
    // Authentication check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '로그?�이 ?�요???�비?�입?�다.');
    }
    const { campaignId, status, followerMin = 0, followerMax = 1000000, category, tier } = data;
    if (!campaignId) {
        throw new functions.https.HttpsError('invalid-argument', '캠페??ID가 ?�요?�니??');
    }
    const db = admin.firestore();
    try {
        // 1. Check if the user is the owner of the campaign (Brand)
        const campaignRef = db.collection('campaigns').doc(campaignId);
        const campaignSnap = await campaignRef.get();
        if (!campaignSnap.exists) {
            throw new functions.https.HttpsError('not-found', '캠페?�을 찾을 ???�습?�다.');
        }
        const campaignData = campaignSnap.data();
        if ((campaignData === null || campaignData === void 0 ? void 0 : campaignData.brandId) !== context.auth.uid) {
            throw new functions.https.HttpsError('permission-denied', '?�당 캠페?�의 지?�자�?조회??권한???�습?�다.');
        }
        // 2. Fetch applications
        let applicationsQuery = db.collection('applications')
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
            var _a, _b;
            const appData = appDoc.data();
            const influencerRef = db.collection('influencers').doc(appData.uid);
            const influencerSnap = await influencerRef.get();
            const influencerData = influencerSnap.exists ? influencerSnap.data() : null;
            return Object.assign(Object.assign({ id: appDoc.id }, appData), { appliedAt: (_b = (_a = appData.appliedAt) === null || _a === void 0 ? void 0 : _a.toDate()) === null || _b === void 0 ? void 0 : _b.toISOString(), influencer: influencerData ? {
                    nickname: influencerData.nickname,
                    profileImage: influencerData.profileImage,
                    tier: influencerData.tier || 'BRONZE',
                    categories: influencerData.categories || [],
                    channels: influencerData.channels || {},
                    // Compute total followers across connected channels
                    totalFollowers: Object.values(influencerData.channels || {}).reduce((sum, channel) => sum + (Number(channel.followers) || 0), 0)
                } : null });
        });
        let results = await Promise.all(influencerPromises);
        // 4. Memory/Server Filtering based on Influencer data
        results = results.filter((item) => {
            if (!item.influencer)
                return false;
            const inf = item.influencer;
            // Filter by Follower count
            if (inf.totalFollowers < followerMin || inf.totalFollowers > followerMax) {
                return false;
            }
            // Filter by Category
            if (category && category !== '?�체') {
                if (!inf.categories.includes(category)) {
                    return false;
                }
            }
            // Filter by Tier
            if (tier && tier !== '?�체') {
                if (inf.tier !== tier) {
                    return false;
                }
            }
            return true;
        });
        return { applications: results };
    }
    catch (error) {
        console.error('Error fetching applications:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', '?�청??목록??불러?�는 �??�류가 발생?�습?�다.');
    }
});
//# sourceMappingURL=getApplications.js.map