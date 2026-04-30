import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, limit, orderBy, onSnapshot } from 'firebase/firestore';
import { Copy, CheckCircle, ChevronRight, TrendingUp, Gift, Package, Edit3, Send, ClipboardList, AlertCircle } from 'lucide-react';
import BottomNav from '../../components/layout/BottomNav';
import { Link, useNavigate } from 'react-router-dom';

interface UserProfile {
  nickname: string;
  sellerCode: string;
  tier?: string;
  points?: number;
  payback?: number;
}

interface Application {
  id: string;
  campaignId: string;
  status: string;
  contentStatus?: string;
}

interface OngoingCampaign {
  appId: string;
  campaignId: string;
  name: string;
  productImageUrl: string;
  deadline: string;
  status: string; // application status
  dDay: number;
}

export default function InfluencerDashboard() {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const [ongoingCampaigns, setOngoingCampaigns] = useState<OngoingCampaign[]>([]);
  const [recommendedCampaigns, setRecommendedCampaigns] = useState<any[]>([]);
  const [imminentCount, setImminentCount] = useState(0);

  useEffect(() => {
    const fetchProfileData = async () => {
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
            payback: data.payback || 0
          });
        }
        
        // Fetch Recommended Campaigns (Latest 2)
        const campaignsRef = collection(db, 'campaigns');
        const q = query(campaignsRef, where('status', 'in', ['active', 'recruiting']), orderBy('createdAt', 'desc'), limit(2));
        const snapshot = await getDocs(q);
        const latest = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setRecommendedCampaigns(latest);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const db = getFirestore();
    
    // Listen to my applications
    const appsQuery = query(collection(db, 'applications'), where('influencerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(appsQuery, async (snapshot) => {
      const activeApps: Application[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Exclude completely finished/rejected ones from ongoing view
        if (data.status !== 'rejected' && data.contentStatus !== 'approved') {
          activeApps.push({
            id: docSnap.id,
            campaignId: data.campaignId,
            status: data.status,
            contentStatus: data.contentStatus
          });
        }
      });

      // Fetch campaign details for these apps
      const ongoing: OngoingCampaign[] = [];
      const now = new Date().getTime();
      let imminent = 0;

      for (const app of activeApps) {
        const campDoc = await getDoc(doc(db, 'campaigns', app.campaignId));
        if (campDoc.exists()) {
          const campData = campDoc.data();
          const deadlineDate = new Date(campData.deadline).getTime();
          const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
          
          ongoing.push({
            appId: app.id,
            campaignId: app.campaignId,
            name: campData.name || '제목 없음',
            productImageUrl: campData.productImageUrl || '',
            deadline: campData.deadline,
            status: app.contentStatus === 'submitted' ? 'submitted' : app.status,
            dDay: diffDays
          });

          // If not submitted yet and deadline is <= 3 days away
          if (diffDays <= 3 && app.contentStatus !== 'submitted') {
            imminent++;
          }
        }
      }

      // Sort by imminent deadline first
      ongoing.sort((a, b) => a.dDay - b.dDay);
      
      setOngoingCampaigns(ongoing);
      setImminentCount(imminent);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCopyCode = () => {
    if (profile?.sellerCode) {
      navigator.clipboard.writeText(profile.sellerCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStepProgress = (status: string) => {
    switch(status) {
      case 'applied': return 0;
      case 'selected': return 1;
      case 'shipping': return 2;
      case 'delivery_confirmed': return 3; // 수령 (이제 작성 단계)
      case 'submitted': return 5;
      default: return 0;
    }
  };

  const steps = [
    { label: '선발' },
    { label: '배송' },
    { label: '수령' },
    { label: '작성' },
    { label: '제출' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Imminent Banner */}
      {imminentCount > 0 && (
        <div className="bg-red-50 text-red-600 px-4 py-3 flex items-center gap-2 text-sm font-bold border-b border-red-100 animate-pulse">
          <AlertCircle size={18} />
          <span>{imminentCount}개의 캠페인 마감이 3일 이내입니다! 서둘러주세요.</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-5 pt-8 pb-6 shadow-sm rounded-b-3xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
              {profile?.nickname?.charAt(0) || 'A'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {profile?.nickname} 님
                <span className="text-[10px] bg-gradient-to-r from-gray-700 to-gray-900 text-white px-2 py-0.5 rounded-full font-medium">
                  {profile?.tier}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">환영합니다! 활발한 활동을 기대할게요.</p>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-gray-900 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          
          <div className="flex justify-between items-center mb-4 relative z-10">
            <span className="text-gray-300 text-sm font-medium">이번 달 페이백</span>
            <button 
              onClick={() => navigate('/influencer/points')}
              className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center gap-1"
            >
              출금 가능 {profile?.points?.toLocaleString() || 0} P
              <ChevronRight size={12} />
            </button>
          </div>
          
          <div className="text-3xl font-bold mb-6 flex items-baseline gap-1 relative z-10">
            {profile?.payback?.toLocaleString() || 0} <span className="text-lg font-medium text-gray-400">원</span>
          </div>

          <div className="bg-black/30 rounded-xl p-3 flex justify-between items-center backdrop-blur-sm border border-white/10 relative z-10">
            <div>
              <div className="text-[10px] text-gray-400 mb-0.5">나의 판매자 코드</div>
              <div className="font-mono text-sm tracking-widest">{profile?.sellerCode}</div>
            </div>
            <button 
              onClick={handleCopyCode}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1.5"
            >
              {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
              <span className="text-xs font-medium">{copied ? '복사됨' : '복사'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-8">
        {/* Ongoing Campaigns */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">진행 중인 캠페인</h2>
            <Link to="/influencer/campaigns" className="text-sm text-gray-500 flex items-center hover:text-gray-900">
              더보기 <ChevronRight size={16} />
            </Link>
          </div>

          {ongoingCampaigns.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <ClipboardList size={24} />
              </div>
              <p className="text-gray-500 font-medium mb-1">진행 중인 캠페인이 없습니다.</p>
              <p className="text-sm text-gray-400 mb-4">새로운 캠페인에 지원해 보세요!</p>
              <Link to="/influencer/campaigns" className="inline-block bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-black transition-colors">
                캠페인 둘러보기
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {ongoingCampaigns.map(camp => {
                const currentStep = getStepProgress(camp.status);
                const isImminent = camp.dDay <= 3 && camp.status !== 'submitted';
                
                return (
                  <div 
                    key={camp.appId}
                    onClick={() => navigate(`/influencer/campaigns/${camp.campaignId}/progress`)}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="flex gap-4 mb-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                        {camp.productImageUrl ? (
                          <img src={camp.productImageUrl} alt={camp.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-gray-900 truncate pr-2">{camp.name}</h3>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${isImminent ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                            D-{camp.dDay >= 0 ? camp.dDay : '마감'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {camp.status === 'applied' ? '선발 대기 중입니다.' : 
                           camp.status === 'selected' ? '브랜드에서 제품을 준비 중입니다.' :
                           camp.status === 'shipping' ? '제품이 배송 중입니다.' :
                           camp.status === 'delivery_confirmed' ? '콘텐츠를 작성해주세요.' :
                           '콘텐츠가 제출되었습니다.'}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative pt-2">
                      <div className="overflow-hidden h-1.5 mb-2 text-xs flex rounded-full bg-gray-100">
                        <div 
                          style={{ width: `${(Math.max(1, currentStep) / 5) * 100}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
                        {steps.map((step, idx) => (
                          <span key={idx} className={currentStep >= idx + 1 ? 'text-blue-600 font-bold' : ''}>
                            {step.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recommended Campaigns */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">추천 캠페인</h2>
            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">AI</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {recommendedCampaigns.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-2 py-4">추천 캠페인을 불러오는 중입니다.</p>
            ) : (
              recommendedCampaigns.map((camp) => (
                <Link to={`/campaigns/${camp.id}`} key={camp.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm active:scale-95 transition-transform block">
                  <div className="w-full aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden">
                    {camp.productImageUrl && <img src={camp.productImageUrl} alt={camp.name} className="w-full h-full object-cover" />}
                  </div>
                  <p className="text-[10px] text-gray-500 truncate mb-1">{camp.brandName || '브랜드명'}</p>
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug">{camp.name}</h3>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
