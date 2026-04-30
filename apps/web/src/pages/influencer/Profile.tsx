import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import ImageUpload from '../../components/common/ImageUpload';

interface SNSChannel {
  enabled: boolean;
  url: string;
  followers: string;
}

export default function InfluencerProfile() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [region, setRegion] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [nicknameError, setNicknameError] = useState('');

  const [sns, setSns] = useState<{ [key: string]: SNSChannel }>({
    instagram: { enabled: false, url: '', followers: '' },
    blog: { enabled: false, url: '', followers: '' },
    tiktok: { enabled: false, url: '', followers: '' },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authUid, setAuthUid] = useState<string | null>(null);

  const availableCategories = ['뷰티', '식품', '생활', '패션', '육아', '기타'];
  const availableRegions = ['전국', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '강원', '제주'];

  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) {
      setAuthUid(auth.currentUser.uid);
    }
  }, []);

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value.slice(0, 20));
    setIsNicknameChecked(false);
    setNicknameError('');
  };

  const checkNicknameDuplicate = async () => {
    if (!nickname.trim()) {
      setNicknameError('닉네임을 입력해주세요.');
      return;
    }
    
    setIsCheckingNickname(true);
    setNicknameError('');
    
    try {
      const db = getFirestore();
      const q = query(collection(db, 'influencers'), where('nickname', '==', nickname.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setNicknameError('이미 사용 중인 닉네임입니다.');
        setIsNicknameChecked(false);
      } else {
        setNicknameError('');
        setIsNicknameChecked(true);
      }
    } catch (error) {
      console.error("Error checking nickname:", error);
      setNicknameError('중복 확인 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingNickname(false);
    }
  };

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter(c => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleSnsToggle = (channel: string) => {
    setSns(prev => ({
      ...prev,
      [channel]: { ...prev[channel], enabled: !prev[channel].enabled }
    }));
  };

  const handleSnsChange = (channel: string, field: 'url' | 'followers', value: string) => {
    setSns(prev => ({
      ...prev,
      [channel]: { ...prev[channel], [field]: value }
    }));
  };

  const generateSellerCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ANT-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isNicknameChecked) {
      alert('닉네임 중복 확인이 필요합니다.');
      return;
    }

    if (categories.length === 0) {
      alert('관심 카테고리를 최소 1개 이상 선택해주세요.');
      return;
    }

    if (!region) {
      alert('활동 지역을 선택해주세요.');
      return;
    }

    // Check if at least one SNS is enabled and filled
    const activeChannels = Object.entries(sns).filter(([_, data]) => data.enabled);
    if (activeChannels.length === 0) {
      alert('최소 1개 이상의 SNS 채널을 등록해주세요.');
      return;
    }

    for (const [key, data] of activeChannels) {
      if (!data.url.trim() || !data.followers.trim()) {
        alert(`${key === 'instagram' ? '인스타그램' : key === 'blog' ? '블로그' : '틱톡'}의 URL과 팔로워 수를 입력해주세요.`);
        return;
      }
    }

    if (!authUid) {
      alert('인증 정보가 없습니다. 다시 로그인해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const db = getFirestore();
      const sellerCode = generateSellerCode();
      
      const influencerData = {
        nickname: nickname.trim(),
        bio: bio.trim(),
        categories,
        region,
        profileImageUrl,
        sns,
        sellerCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'influencers', authUid), influencerData);
      
      alert(`프로필이 등록되었습니다! 발급된 셀러 코드: ${sellerCode}`);
      navigate('/influencer/dashboard');
    } catch (error) {
      console.error("Error saving profile:", error);
      alert('프로필 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>인플루언서 프로필 등록</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Profile Image */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>프로필 이미지 (선택)</label>
          <ImageUpload 
            pathGenerator={(file) => `influencers/${authUid || 'temp'}/profile_${Date.now()}_${file.name}`}
            onChange={(url) => setProfileImageUrl(url as string)}
            onError={(err) => alert(err)}
          />
        </div>

        {/* Nickname */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>닉네임 (필수)</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="최대 20자"
              maxLength={20}
              style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db' }}
              required
            />
            <button 
              type="button" 
              onClick={checkNicknameDuplicate}
              disabled={isCheckingNickname || !nickname.trim()}
              style={{ padding: '10px 16px', borderRadius: '4px', backgroundColor: '#e5e7eb', border: 'none', cursor: 'pointer' }}
            >
              {isCheckingNickname ? '확인 중...' : '중복 확인'}
            </button>
          </div>
          {nicknameError && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{nicknameError}</div>}
          {isNicknameChecked && <div style={{ color: '#10b981', fontSize: '12px', marginTop: '4px' }}>사용 가능한 닉네임입니다.</div>}
        </div>

        {/* Bio */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>자기소개 (선택)</label>
          <textarea 
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 100))}
            placeholder="최대 100자"
            maxLength={100}
            rows={3}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db', resize: 'vertical' }}
          />
        </div>

        {/* Categories */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>관심 카테고리 (최소 1개)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {availableCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  border: `1px solid ${categories.includes(cat) ? '#2563eb' : '#d1d5db'}`,
                  backgroundColor: categories.includes(cat) ? '#eff6ff' : 'white',
                  color: categories.includes(cat) ? '#2563eb' : '#4b5563',
                  cursor: 'pointer'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Region */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>활동 지역 (필수)</label>
          <select 
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            required
          >
            <option value="">지역을 선택하세요</option>
            {availableRegions.map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>
        </div>

        {/* SNS Channels */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>SNS 채널 등록</label>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>최소 1개 이상의 채널을 활성화하고 정보를 입력해주세요.</p>
          
          {['instagram', 'blog', 'tiktok'].map(channel => {
            const label = channel === 'instagram' ? '인스타그램' : channel === 'blog' ? '네이버 블로그' : '틱톡';
            const isActive = sns[channel].enabled;
            
            return (
              <div key={channel} style={{ marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>{label}</span>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={isActive}
                      onChange={() => handleSnsToggle(channel)}
                      style={{ marginRight: '8px' }}
                    />
                    활성화
                  </label>
                </div>
                
                {isActive && (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <input 
                        type="url" 
                        placeholder={`${label} URL 입력`}
                        value={sns[channel].url}
                        onChange={(e) => handleSnsChange(channel, 'url', e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      />
                    </div>
                    <div>
                      <input 
                        type="number" 
                        placeholder="팔로워/이웃 수 (숫자만 입력)"
                        value={sns[channel].followers}
                        onChange={(e) => handleSnsChange(channel, 'followers', e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <button 
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '16px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? '저장 중...' : '프로필 저장 및 시작하기'}
        </button>
      </form>
    </div>
  );
}
