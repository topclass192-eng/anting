"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const kakaoAuth_1 = require("./kakaoAuth");
const naverAuth_1 = require("./naverAuth");
const socialAuth_1 = require("./socialAuth");
const errors_1 = require("../utils/errors");
const instagramAuth_1 = require("./instagramAuth");
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
const kakaoProvider = new kakaoAuth_1.KakaoAuthProvider();
const naverProvider = new naverAuth_1.NaverAuthProvider();
async function handleSocialLogin(provider, req, res) {
    try {
        const { code, state } = req.body;
        if (!code) {
            res.status(400).json({ error: true, message: '인가 코드가 없습니다.' });
            return;
        }
        const accessToken = await provider.getToken(code, state);
        const socialUser = await provider.getUserInfo(accessToken);
        const { firebaseToken, isNewUser } = await (0, socialAuth_1.createFirebaseToken)(socialUser);
        res.status(200).json({
            firebaseToken,
            isNewUser
        });
    }
    catch (error) {
        functions.logger.error('Social auth error:', error);
        res.status(500).json((0, errors_1.handleError)(error));
    }
}
app.post('/auth/kakao', (req, res) => {
    return handleSocialLogin(kakaoProvider, req, res);
});
app.post('/auth/naver', (req, res) => {
    return handleSocialLogin(naverProvider, req, res);
});
app.get('/auth/instagram/url', (req, res) => {
    try {
        const url = (0, instagramAuth_1.getInstagramAuthUrl)();
        res.status(200).json({ url });
    }
    catch (error) {
        res.status(500).json({ error: true, message: 'OAuth URL 생성 실패' });
    }
});
app.post('/auth/instagram/connect', async (req, res) => {
    try {
        const { uid, code } = req.body;
        if (!uid || !code) {
            res.status(400).json({ error: true, message: 'uid와 code가 필요합니다.' });
            return;
        }
        await (0, instagramAuth_1.connectInstagramAccount)(uid, code);
        res.status(200).json({ success: true, message: '인스타그램 연동 성공' });
    }
    catch (error) {
        // As requested by the user, return the specific fallback error message
        res.status(400).json({
            error: true,
            message: "인스타그램 연동에 실패했습니다. 팔로워 수를 직접 입력해 주세요.",
            details: error.message
        });
    }
});
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map