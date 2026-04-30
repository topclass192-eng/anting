import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Filter, CheckCircle, XCircle, Search, SlidersHorizontal, Camera } from 'lucide-react';

interface Influencer {
  nickname: string;
  profileImage?: string;
  tier: string;
  totalFollowers: number;
  channels?: any;
  categories?: string[];
}

interface Application {
  id: string;
  uid: string;
  campaignId: string;
  status: 'pending' | 'selected' | 'rejected' | 'completed';
  appliedAt: string;
  influencer: Influencer | null;
}

export default function ApplicantList() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignData, setCampaignData] = useState<any>(null);

  // Filters
  const [followerMin, setFollowerMin] = useState<number>(0);
  const [followerMax, setFollowerMax] = useState<number>(1000000);
  const [category, setCategory] = useState<string>('전체');
  const [tier, setTier] = useState<string>('전체');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const functions = getFunctions();
      const getAppsCall = httpsCallable(functions, 'getApplications');
      
      const response = await getAppsCall({
        campaignId: id,
        followerMin,
        followerMax,
        category,
        tier
      });

      const data = response.data as { applications: Application[] };
      setApplications(data.applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('신청자 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!id) return;
      try {
        const db = getFirestore();
        const docRef = doc(db, 'campaigns', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCampaignData(docSnap.data());
        }
      } catch (error) {
        console.error('Error fetching campaign:', error);
      }
    };

    fetchCampaignData();
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchApplications();
    }
  }, [id, followerMin, followerMax, category, tier]);

  const handleAction = async (applicationId: string, action: 'selected' | 'rejected') => {
    if (!window.confirm(action === 'selected' ? '이 지원자를 선발하시겠습니까?' : '이 지원자를 탈락시키겠습니까?')) return;
    
    try {
      const functions = getFunctions();
      const selectCall = httpsCallable(functions, 'selectApplicant');
      await selectCall({ applicationId, action });
      
      // Update local state optimistic
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status: action } : app
      ));
      
      if (action === 'selected') {
        setCampaignData((prev: any) => ({
          ...prev,
          recruitedCount: (prev?.recruitedCount || 0) + 1
        }));
      } else if (action === 'rejected' && applications.find(a => a.id === applicationId)?.status === 'selected') {
         setCampaignData((prev: any) => ({
          ...prev,
          recruitedCount: Math.max(0, (prev?.recruitedCount || 0) - 1)
        }));
      }

    } catch (error: any) {
      console.error('Action failed:', error);
      alert(error?.message || '처리 중 오류가 발생했습니다.');
    }
  };

  const displayedApps = activeTab === 'all' 
    ? applications.filter(a => a.status === 'pending') 
    : applications.filter(a => a.status === 'selected');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center px-4 h-14 border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">신청자 관리</h1>
        </div>
        
        {/* Campaign Info Summary */}
        {campaignData && (
          <div className="px-5 py-4">
            <h2 className="text-gray-900 font-bold mb-1 truncate">{campaignData.name}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">
                모집 현황
              </span>
              <span className="text-sm font-bold text-gray-900">
                선발 <span className="text-blue-600">{campaignData.recruitedCount || 0}</span> / {campaignData.recruitmentCount}명
              </span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-t border-gray-100">
          <button 
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'all' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'}`}
            onClick={() => setActiveTab('all')}
          >
            대기중 ({applications.filter(a => a.status === 'pending').length})
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'selected' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}
            onClick={() => setActiveTab('selected')}
          >
            선발 완료 ({applications.filter(a => a.status === 'selected').length})
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white px-4 py-3 mb-2 flex items-center gap-2 overflow-x-auto shadow-sm no-scrollbar">
        <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full whitespace-nowrap">
          <SlidersHorizontal size={14} className="text-gray-500" />
          <select 
            className="bg-transparent text-xs font-medium text-gray-700 outline-none"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
          >
            <option value="전체">모든 등급</option>
            <option value="BRONZE">Bronze</option>
            <option value="SILVER">Silver</option>
            <option value="GOLD">Gold</option>
          </select>
        </div>
        
        <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full whitespace-nowrap">
          <select 
            className="bg-transparent text-xs font-medium text-gray-700 outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="전체">모든 카테고리</option>
            <option value="뷰티">뷰티</option>
            <option value="패션">패션</option>
            <option value="식품">식품</option>
            <option value="라이프">라이프</option>
          </select>
        </div>

        {/* Note: In a real app, follower range would use a dual slider, keeping it simple here with predefined ranges */}
        <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full whitespace-nowrap">
          <select 
            className="bg-transparent text-xs font-medium text-gray-700 outline-none"
            onChange={(e) => {
              const val = e.target.value;
              if (val === '0') { setFollowerMin(0); setFollowerMax(1000000); }
              if (val === '1') { setFollowerMin(1000); setFollowerMax(5000); }
              if (val === '2') { setFollowerMin(5000); setFollowerMax(10000); }
              if (val === '3') { setFollowerMin(10000); setFollowerMax(1000000); }
            }}
          >
            <option value="0">팔로워 (전체)</option>
            <option value="1">1K - 5K</option>
            <option value="2">5K - 10K</option>
            <option value="3">10K 이상</option>
          </select>
        </div>
      </div>

      {/* Application List */}
      <div className="px-4 py-2 space-y-3">
        {loading ? (
          <div className="py-20 text-center text-gray-400">데이터를 불러오는 중입니다...</div>
        ) : displayedApps.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Search size={24} />
            </div>
            <p className="text-gray-500 font-medium">조건에 맞는 신청자가 없습니다.</p>
          </div>
        ) : (
          displayedApps.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gray-200 rounded-full overflow-hidden shrink-0">
                  {app.influencer?.profileImage ? (
                    <img src={app.influencer.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold bg-gray-100">
                      {app.influencer?.nickname?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-base">{app.influencer?.nickname || '알 수 없음'}</span>
                    <span className="bg-gray-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {app.influencer?.tier}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <Camera size={14} className="text-pink-600" />
                      <span className="font-medium">{(app.influencer?.totalFollowers || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {app.influencer?.categories?.slice(0, 3).map((cat: string, idx: number) => (
                      <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">#{cat}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-2">
                {activeTab === 'all' && (
                  <>
                    <button 
                      onClick={() => handleAction(app.id, 'rejected')}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors flex justify-center items-center gap-1.5"
                    >
                      <XCircle size={16} /> 탈락
                    </button>
                    <button 
                      onClick={() => handleAction(app.id, 'selected')}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors flex justify-center items-center gap-1.5"
                    >
                      <CheckCircle size={16} /> 선발
                    </button>
                  </>
                )}
                {activeTab === 'selected' && (
                  <button 
                    onClick={() => navigate(`/brand/campaigns/${id}/shipping`)}
                    className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-colors"
                  >
                    운송장 입력
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-gray-100 pb-safe">
        {activeTab === 'all' ? (
          <button 
            onClick={() => navigate('/brand/dashboard')}
            className="w-full bg-gray-900 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-black transition-colors"
          >
            선발 완료 ({applications.filter(a => a.status === 'selected').length}명)
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => navigate(`/brand/campaigns/${id}/shipping`)}
              className="flex-1 bg-gray-100 text-gray-900 font-bold text-lg py-4 rounded-xl hover:bg-gray-200 transition-colors"
            >
              운송장 일괄입력
            </button>
            <button 
              onClick={() => navigate(`/brand/campaigns/${id}/review`)}
              className="flex-1 bg-blue-600 text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-colors"
            >
              콘텐츠 검수하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
