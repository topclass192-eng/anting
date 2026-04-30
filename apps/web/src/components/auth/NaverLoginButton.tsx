import React, { useState, useEffect } from 'react';

const NAVER_CLIENT_ID = process.env.REACT_APP_NAVER_CLIENT_ID || 'WAJTfNWE6MMDcVAmjht5';
const NAVER_REDIRECT_URI = process.env.REACT_APP_NAVER_REDIRECT_URI || 'http://localhost:5001/anting-app/asia-northeast3/api/auth/naver/callback';

const generateState = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export default function NaverLoginButton() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const returnedState = urlParams.get('state');
    
    if (code) {
      handleNaverCallback(code, returnedState);
    }
  }, []);

  const handleNaverCallback = async (code: string, returnedState: string | null) => {
    const savedState = sessionStorage.getItem('oauth_state_naver');
    if (returnedState && savedState && returnedState !== savedState) {
        setErrorMsg('비정상적인 접근입니다 (CSRF STATE 불일치).');
        return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('http://localhost:5001/anting-app/asia-northeast3/api/auth/naver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state: returnedState })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '네이버 로그인 처리 실패');
      }

      const { firebaseToken, isNewUser } = data;
      console.log('Firebase Custom Token 네이버 로그인 성공! Token:', firebaseToken, 'New User:', isNewUser);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '네이버 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      sessionStorage.removeItem('oauth_state_naver');
    }
  };

  const handleNaverLoginClick = () => {
    const state = generateState();
    sessionStorage.setItem('oauth_state_naver', state);
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${NAVER_REDIRECT_URI}&state=${state}`;
    window.location.href = naverAuthUrl;
  };

  return (
    <div style={{ margin: '20px 0' }}>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      <button 
        onClick={handleNaverLoginClick}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#03C75A',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        {loading ? '로그인 처리 중...' : '네이버 계정으로 로그인'}
      </button>
    </div>
  );
}
