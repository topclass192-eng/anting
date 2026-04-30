import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// removed useAuth
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Settings, Copy, CheckCircle, ChevronRight, Share2, LogOut, Award } from 'lucide-react';
import BottomNav from '../../components/layout/BottomNav';

interface UserProfile {
  nickname: string;
  sellerCode: string;
  tier: string;
  points: number;
  profileImageUrl?: string;
}

export default function MyPage() {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const db = getFirestore();
        const docRef = doc(db, 'influencers', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            nickname: data.nickname || '인플루언서',
            sellerCode: data.sellerCode || 'ANT-00000000',
            tier: data.tier || 'BRONZE',
            points: data.points || 0,
            profileImageUrl: data.profileImageUrl || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleCopyCode = () => {
    if (profile?.sellerCode) {
      navigator.clipboard.writeText(profile.sellerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share && profile?.sellerCode) {
      navigator.share({
        title: '앤팅 셀러 코드',
        text: `저의 앤팅 셀러 코드입니다: ${profile.sellerCode}`,
        url: 'https://anting.app' // 실제 앱 주소
      }).catch(console.error);
    } else {
      handleCopyCode();
    }
  };

  // 등급 계산 로직 (임시)
  const getNextTierInfo = (currentTier: string, points: number) => {
    if (currentTier === 'BRONZE') return { next: 'SILVER', required: 1000 - points };
    if (currentTier === 'SILVER') return { next: 'GOLD', required: 5000 - points };
    if (currentTier === 'GOLD') return { next: 'PLATINUM', required: 20000 - points };
    return { next: 'MAX', required: 0 };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const nextTierInfo = profile ? getNextTierInfo(profile.tier, profile.points) : { next: 'MAX', required: 0 };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Header */}
      <header className="bg-white px-5 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h1 className="m-0 text-xl font-bold text-gray-900 tracking-tight">마이페이지</h1>
        <button className="text-gray-600 hover:text-gray-900 transition-colors">
          <Settings size={24} />
        </button>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 relative">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
            {profile?.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-2xl text-blue-600">{profile?.nickname?.charAt(0) || 'A'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{profile?.nickname}</h2>
            <p className="text-sm text-gray-500">인플루언서</p>
          </div>
          <Link 
            to="/influencer/profile" 
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors shrink-0"
          >
            프로필 수정
          </Link>
        </div>

        {/* Tier & Points Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Award size={20} className="text-blue-600" />
            <h3 className="font-bold text-gray-900">내 등급 현황</h3>
          </div>
          
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-sm text-gray-500 mb-1">현재 등급</div>
              <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {profile?.tier}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">보유 포인트</div>
              <div className="text-lg font-bold text-gray-900">{profile?.points.toLocaleString()} <span className="text-sm font-medium text-gray-500">P</span></div>
            </div>
          </div>

          {nextTierInfo.required > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>다음 등급({nextTierInfo.next})까지</span>
                <span className="font-bold text-blue-600">{nextTierInfo.required.toLocaleString()} P 남음</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, 100 - (nextTierInfo.required / 1000) * 100))}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Seller Code Card */}
        <div className="bg-gray-900 rounded-2xl p-5 text-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-gray-400 mb-1">나의 전용 판매자 코드</h3>
            <div className="flex items-center justify-between mt-2">
              <div className="text-2xl font-mono tracking-wider font-bold">{profile?.sellerCode}</div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopyCode}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="코드 복사"
                >
                  {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
                <button 
                  onClick={handleShare}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  aria-label="코드 공유"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-100">
            <button 
              onClick={() => navigate('/influencer/points')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-700">포인트 및 수익 내역</span>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <span className="font-medium text-gray-700">고객센터</span>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <span className="font-medium text-gray-700">이용약관 및 정책</span>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full py-4 flex items-center justify-center gap-2 text-gray-500 font-medium hover:text-red-500 transition-colors mt-8"
        >
          <LogOut size={18} />
          <span>로그아웃</span>
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
