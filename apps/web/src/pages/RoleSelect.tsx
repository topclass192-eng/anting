import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

type RoleOption = 'brand' | 'influencer' | 'shopper';

export default function RoleSelect() {
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!selectedRole) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const auth = getAuth();
      if (!auth.currentUser) throw new Error("로그인된 사용자가 없습니다.");

      const functions = getFunctions();
      const setUserRole = httpsCallable(functions, 'setUserRole');
      
      const res = await setUserRole({ role: selectedRole });
      const data = res.data as any;

      if (data.error) {
        throw new Error(data.message || '역할 설정 중 오류가 발생했습니다.');
      }

      // Force refresh the token to immediately see the new Custom Claims
      await auth.currentUser.getIdToken(true);

      // Navigate to the respective dashboard
      if (selectedRole === 'brand') navigate('/brand/dashboard', { replace: true });
      if (selectedRole === 'influencer') navigate('/influencer/dashboard', { replace: true });
      if (selectedRole === 'shopper') navigate('/shop', { replace: true });
      
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = (role: RoleOption) => ({
    padding: '20px',
    margin: '10px 0',
    border: selectedRole === role ? '2px solid #000' : '1px solid #ccc',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: selectedRole === role ? '#f9f9f9' : '#fff'
  });

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 20 }}>앤팅에 오신 것을 환영합니다!</h2>
      {errorMsg && <p style={{ color: 'red', textAlign: 'center' }}>{errorMsg}</p>}
      
      <div style={cardStyle('brand')} onClick={() => setSelectedRole('brand')}>
        <h3 style={{ margin: '0 0 10px 0' }}>브랜드 / 광고주</h3>
        <p style={{ margin: 0, color: '#666' }}>제품을 홍보하고 싶어요</p>
      </div>

      <div style={cardStyle('influencer')} onClick={() => setSelectedRole('influencer')}>
        <h3 style={{ margin: '0 0 10px 0' }}>인플루언서</h3>
        <p style={{ margin: 0, color: '#666' }}>체험단에 참여하고 싶어요</p>
      </div>

      <div style={cardStyle('shopper')} onClick={() => setSelectedRole('shopper')}>
        <h3 style={{ margin: '0 0 10px 0' }}>일반 쇼퍼</h3>
        <p style={{ margin: 0, color: '#666' }}>쇼핑하고 싶어요</p>
      </div>

      <button
        disabled={!selectedRole || loading}
        onClick={handleStart}
        style={{
          width: '100%',
          padding: '15px',
          marginTop: '20px',
          backgroundColor: selectedRole && !loading ? '#000' : '#ccc',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: selectedRole && !loading ? 'pointer' : 'not-allowed'
        }}
      >
        {loading ? '설정 중...' : '시작하기'}
      </button>
    </div>
  );
}
