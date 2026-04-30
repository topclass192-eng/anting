"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KakaoAuthProvider = void 0;
class KakaoAuthProvider {
    async getToken(code, state) {
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
        const data = await response.json();
        return data.access_token;
    }
    async getUserInfo(accessToken) {
        var _a, _b, _c, _d, _e;
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
            email: ((_a = data.kakao_account) === null || _a === void 0 ? void 0 : _a.email) || null,
            displayName: ((_c = (_b = data.kakao_account) === null || _b === void 0 ? void 0 : _b.profile) === null || _c === void 0 ? void 0 : _c.nickname) || 'Kakao User',
            profileImageUrl: (_e = (_d = data.kakao_account) === null || _d === void 0 ? void 0 : _d.profile) === null || _e === void 0 ? void 0 : _e.profile_image_url
        };
    }
}
exports.KakaoAuthProvider = KakaoAuthProvider;
//# sourceMappingURL=kakaoAuth.js.map