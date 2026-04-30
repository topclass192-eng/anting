import { ISocialAuthProvider, ISocialUser } from './socialAuth';

interface KakaoTokenResponse {
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    refresh_token_expires_in: number;
}

export class KakaoAuthProvider implements ISocialAuthProvider {
    async getToken(code: string, state?: string): Promise<string> {
        if (code === 'MOCK_CODE' && process.env.FUNCTIONS_EMULATOR === 'true') {
            return 'mock_access_token';
        }

        const clientId = process.env.KAKAO_REST_API_KEY;
        const redirectUri = process.env.KAKAO_REDIRECT_URI;

        if (!clientId || !redirectUri) {
            throw new Error("환경변수에 KAKAO_REST_API_KEY 또는 KAKAO_REDIRECT_URI가 누락되었습니다.");
        }

        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            redirect_uri: redirectUri,
            code,
        });

        const response = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Kakao token fetching failed: ${errorData.error_description || response.statusText}`);
        }

        const data: KakaoTokenResponse = await response.json();
        return data.access_token;
    }

    async getUserInfo(accessToken: string): Promise<ISocialUser> {
        if (accessToken === 'mock_access_token' && process.env.FUNCTIONS_EMULATOR === 'true') {
            return {
                providerId: 'kakao',
                socialUserId: '88888888',
                email: 'mock_kakao_user@anting.app',
                displayName: 'Mock Kakao Profile'
            };
        }

        const response = await fetch('https://kapi.kakao.com/v2/user/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-type': 'application/x-www-form-urlencoded;charset=utf-8'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Kakao user fetching failed: ${errorData.msg || response.statusText}`);
        }

        const data = await response.json();
        
        return {
            providerId: 'kakao',
            socialUserId: data.id.toString(),
            email: data.kakao_account?.email || null,
            displayName: data.kakao_account?.profile?.nickname || 'Kakao User',
            profileImageUrl: data.kakao_account?.profile?.profile_image_url
        };
    }
}
