import * as functions from 'firebase-functions';
import * as express from 'express';
import * as cors from 'cors';
import { KakaoAuthProvider } from './kakaoAuth';
import { NaverAuthProvider } from './naverAuth';
import { createFirebaseToken, ISocialAuthProvider } from './socialAuth';
import { handleError } from '../utils/errors';
import { getInstagramAuthUrl, connectInstagramAccount } from './instagramAuth';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const kakaoProvider = new KakaoAuthProvider();
const naverProvider = new NaverAuthProvider();

async function handleSocialLogin(provider: ISocialAuthProvider, req: express.Request, res: express.Response) {
    try {
        const { code, state } = req.body;
        if (!code) {
            res.status(400).json({ error: true, message: '인가 코드가 없습니다.' });
            return;
        }

        const accessToken = await provider.getToken(code, state);
        const socialUser = await provider.getUserInfo(accessToken);
        const { firebaseToken, isNewUser } = await createFirebaseToken(socialUser);

        res.status(200).json({
            firebaseToken,
            isNewUser
        });
    } catch (error) {
        functions.logger.error('Social auth error:', error);
        res.status(500).json(handleError(error));
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
        const url = getInstagramAuthUrl();
        res.status(200).json({ url });
    } catch (error) {
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

        await connectInstagramAccount(uid, code);
        
        res.status(200).json({ success: true, message: '인스타그램 연동 성공' });
    } catch (error: any) {
        // As requested by the user, return the specific fallback error message
        res.status(400).json({ 
            error: true, 
            message: "인스타그램 연동에 실패했습니다. 팔로워 수를 직접 입력해 주세요.",
            details: error.message
        });
    }
});

export const api = functions.https.onRequest(app);
