import React, { useState } from 'react';
// import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'; // 실제 적용 시 주석 해제하여 연결

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // const auth = getAuth();
      // await signInWithEmailAndPassword(auth, email, password);
      // 로그인 성공 시 라우팅 처리 등 작성
      
      // 임시 딜레이 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('로그인 성공:', email);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setErrorMsg('로그인 중 문제가 발생했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>이메일 로그인</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {errorMsg && (
          <div style={{ color: 'red', fontSize: '0.9rem', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>이메일</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }} 
            required
            placeholder="이메일 입력" 
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>비밀번호</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '0.5rem' }} 
            required 
            placeholder="비밀번호 입력"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '0.75rem', background: '#333', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          {loading ? '로그인 처리 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
