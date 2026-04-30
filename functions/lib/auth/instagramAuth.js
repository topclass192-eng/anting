"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstagramAuthUrl = getInstagramAuthUrl;
exports.getInstagramToken = getInstagramToken;
exports.getInstagramUser = getInstagramUser;
exports.connectInstagramAccount = connectInstagramAccount;
const functions = require("firebase-functions");
const axios_1 = require("axios");
const firestore_1 = require("firebase-admin/firestore");
function getInstagramAuthUrl() {
    const appId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    if (!appId || !redirectUri) {
        functions.logger.warn('Instagram APP_ID or REDIRECT_URI is not set.');
    }
    // Basic Display API OAuth URL
    return `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`;
}
async function getInstagramToken(code) {
    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    const form = new URLSearchParams();
    form.append('client_id', appId || '');
    form.append('client_secret', appSecret || '');
    form.append('grant_type', 'authorization_code');
    form.append('redirect_uri', redirectUri || '');
    form.append('code', code);
    const response = await axios_1.default.post('https://api.instagram.com/oauth/access_token', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data.access_token;
}
async function getInstagramUser(token) {
    // Request fields from Instagram Basic Display API
    // Note: Basic Display API does not provide follower_count. 
    // We request username, media_count to simulate the response.
    const response = await axios_1.default.get('https://graph.instagram.com/me', {
        params: {
            fields: 'id,username,account_type,media_count',
            access_token: token
        }
    });
    return response.data;
}
async function connectInstagramAccount(uid, code) {
    try {
        const token = await getInstagramToken(code);
        const user = await getInstagramUser(token);
        // Fallback or simulate follower_count since Basic Display doesn't provide it
        // If this was Graph API, we would extract followers_count.
        // For the sake of the requirement, if there is no follower count provided by the API, we will throw an error to trigger the manual fallback as instructed.
        const followerCount = user.followers_count; // This will be undefined in Basic Display
        if (followerCount === undefined || followerCount === null) {
            // Throw error to trigger the requested fallback message
            throw new Error("Missing follower count from API");
        }
        const db = (0, firestore_1.getFirestore)();
        await db.collection('influencers').doc(uid).set({
            sns: {
                instagram: {
                    enabled: true,
                    url: `https://instagram.com/${user.username}`,
                    followers: String(followerCount),
                    mediaCount: user.media_count
                }
            }
        }, { merge: true });
    }
    catch (error) {
        functions.logger.error('Error connecting Instagram:', error);
        throw new Error("인스타그램 연동에 실패했습니다. 팔로워 수를 직접 입력해 주세요.");
    }
}
//# sourceMappingURL=instagramAuth.js.map