import React, { useState, useEffect } from 'react';

const KAKAO_CLIENT_ID = process.env.REACT_APP_KAKAO_REST_API_KEY || '0293813f9f7d77ee4adb97b66145fbce';
const KAKAO_REDIRECT_URI = process.env.REACT_APP_KAKAO_REDIRECT_URI || 'http://localhost:5001/anting-app/asia-northeast3/api/auth/kakao/callback';

const generateState = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export default function KakaoLoginButton() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const returnedState = urlParams.get('state');
    
    if (code) {
      handleKakaoCallback(code, returnedState);
    }
  }, []);

  const handleKakaoCallback = async (code: string, returnedState: string | null) => {
    const savedState = sessionStorage.getItem('oauth_state_kakao');
    if (returnedState && savedState && returnedState !== savedState) {
        setErrorMsg('비정상적인 접근입니다 (CSRF STATE 불일치).');
        return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('http://localhost:5001/anting-app/asia-northeast3/api/auth/kakao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state: returnedState })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '카카오 로그인 처리 실패');
      }

      const { firebaseToken, isNewUser } = data;
      console.log('Firebase Custom Token 카카오 로그인 성공! Token:', firebaseToken, 'New User:', isNewUser);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '카카오 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      sessionStorage.removeItem('oauth_state_kakao');
    }
  };

  const handleKakaoLoginClick = () => {
    const state = generateState();
    sessionStorage.setItem('oauth_state_kakao', state);
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code&state=${state}`;
    window.location.href = kakaoAuthUrl;
  };

  return (
    <div style={{ margin: '20px 0' }}>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      <button 
        onClick={handleKakaoLoginClick}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#FEE500',
          color: '#000000',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        {loading ? '로그인 처리 중...' : '카카오 계정으로 로그인'}
      </button>
    </div>
  );
}
