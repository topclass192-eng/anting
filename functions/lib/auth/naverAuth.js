"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NaverAuthProvider = void 0;
class NaverAuthProvider {
    async getToken(code, state) {
        if (code === 'MOCK_NAVER_CODE' && process.env.FUNCTIONS_EMULATOR === 'true') {
            return 'mock_naver_access_token';
        }
        const clientId = process.env.NAVER_CLIENT_ID;
        const clientSecret = process.env.NAVER_CLIENT_SECRET;
        const redirectUri = process.env.NAVER_REDIRECT_URI;
        if (!clientId || !clientSecret || !redirectUri) {
            throw new Error("환경변수에 네이버 앱 설정이 누락되었습니다.");
        }
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code,
            state: state || 'default_state',
        });
        const response = await fetch(`https://nid.naver.com/oauth2.0/token?${params.toString()}`, {
            method: 'GET'
        });
        const data = await response.json();
        if (data.error || !data.access_token) {
            throw new Error(`Naver token fetching failed: ${data.error_description || 'Unknown error'}`);
        }
        return data.access_token;
    }
    async getUserInfo(accessToken) {
        if (accessToken === 'mock_naver_access_token' && process.env.FUNCTIONS_EMULATOR === 'true') {
            return {
                providerId: 'naver',
                socialUserId: 'naver_12345678',
                email: 'mock_kakao_user@anting.app', // SAME email as Kakao mock user to test merging
                displayName: 'Mock Naver Profile'
            };
        }
        const response = await fetch('https://openapi.naver.com/v1/nid/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        if (data.resultcode !== '00') {
            throw new Error(`Naver user fetching failed: ${data.message}`);
        }
        const res = data.response;
        return {
            providerId: 'naver',
            socialUserId: res.id,
            email: res.email || null,
            displayName: res.name || res.nickname || 'Naver User',
            profileImageUrl: res.profile_image
        };
    }
}
exports.NaverAuthProvider = NaverAuthProvider;
//# sourceMappingURL=naverAuth.js.map