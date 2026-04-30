import * as functions from 'firebase-functions';
import axios from 'axios';
import { getFirestore } from 'firebase-admin/firestore';

export function getInstagramAuthUrl(): string {
    const appId = process.env.INSTAGRAM_APP_ID;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;
    
    if (!appId || !redirectUri) {
        functions.logger.warn('Instagram APP_ID or REDIRECT_URI is not set.');
    }
    
    // Basic Display API OAuth URL
    return `https://api.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`;
}

export async function getInstagramToken(code: string): Promise<string> {
    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

    const form = new URLSearchParams();
    form.append('client_id', appId || '');
    form.append('client_secret', appSecret || '');
    form.append('grant_type', 'authorization_code');
    form.append('redirect_uri', redirectUri || '');
    form.append('code', code);

    const response = await axios.post('https://api.instagram.com/oauth/access_token', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return response.data.access_token;
}

export async function getInstagramUser(token: string): Promise<any> {
    // Request fields from Instagram Basic Display API
    // Note: Basic Display API does not provide follower_count. 
    // We request username, media_count to simulate the response.
    const response = await axios.get('https://graph.instagram.com/me', {
        params: {
            fields: 'id,username,account_type,media_count',
            access_token: token
        }
    });

    return response.data;
}

export async function connectInstagramAccount(uid: string, code: string): Promise<void> {
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

        const db = getFirestore();
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

    } catch (error) {
        functions.logger.error('Error connecting Instagram:', error);
        throw new Error("인스타그램 연동에 실패했습니다. 팔로워 수를 직접 입력해 주세요.");
    }
}
