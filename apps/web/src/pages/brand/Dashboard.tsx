import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import StatusBadge from '../../components/common/StatusBadge';
import BottomNav from '../../components/layout/BottomNav';
import { Plus, Users, CheckCircle, BarChart2, ChevronRight, Activity } from 'lucide-react';

interface CampaignData {
  id: string;
  name: string;
  status: 'draft' | 'recruiting' | 'active' | 'progress' | 'ongoing' | 'completed' | 'closed';
  deadline: string;
  participants: number;
  applicantCount: number;
  submittedCount: number;
  approvedCount: number;
}

export default function BrandDashboard() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'recruiting' | 'active' | 'completed'>('all');

  // Summary stats
  const [activeCampaignCount, setActiveCampaignCount] = useState(0);
  const [newApplicantCount, setNewApplicantCount] = useState(0);
  const [approvedContentCount, setApprovedContentCount] = useState(0);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const db = getFirestore();
    
    // Listen to campaigns
    const qCamps = query(collection(db, 'campaigns'), where('brandId', '==', user.uid));
    const unsubCamps = onSnapshot(qCamps, (campSnap) => {
      // Listen to applications to aggregate counts
      const qApps = query(collection(db, 'applications'), where('brandId', '==', user.uid));
      const unsubApps = onSnapshot(qApps, (appSnap) => {
        
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

        let newApps = 0;
        let approvedContents = 0;
        const appCountsByCamp: Record<string, { total: number; submitted: number; approved: number }> = {};

        appSnap.forEach(doc => {
          const data = doc.data();
          const campId = data.campaignId;
          
          if (!appCountsByCamp[campId]) {
            appCountsByCamp[campId] = { total: 0, submitted: 0, approved: 0 };
          }
          
          appCountsByCamp[campId].total++;
          
          if (data.contentStatus === 'submitted' || data.contentStatus === 'approved') {
            appCountsByCamp[campId].submitted++;
          }
          if (data.contentStatus === 'approved') {
            appCountsByCamp[campId].approved++;
          }

          // Count today's new applicants
          let createdAtTime = 0;
          if (data.createdAt && typeof data.createdAt === 'string') {
            createdAtTime = new Date(data.createdAt).getTime();
          } else if (data.createdAt?.seconds) {
            createdAtTime = data.createdAt.seconds * 1000;
          }
          if (createdAtTime >= startOfToday) {
            newApps++;
          }

          // Count this month's approved contents
          if (data.contentStatus === 'approved' && data.contentApprovedAt) {
            const approvedTime = new Date(data.contentApprovedAt).getTime();
            if (approvedTime >= startOfMonth) {
              approvedContents++;
            }
          }
        });

        const camps: CampaignData[] = [];
        let activeCount = 0;

        campSnap.forEach(doc => {
          const data = doc.data();
          const id = doc.id;
          
          const appStats = appCountsByCamp[id] || { total: 0, submitted: 0, approved: 0 };

          camps.push({
            id,
            name: data.name || '제목 없음',
            status: data.status || 'draft',
            deadline: data.deadline || '',
            participants: data.participants || 0,
            applicantCount: appStats.total,
            submittedCount: appStats.submitted,
            approvedCount: appStats.approved,
          });

          if (['active', 'recruiting', 'progress', 'ongoing'].includes(data.status)) {
            activeCount++;
          }
        });

        // 최신 마감일 순으로 정렬
        camps.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
        
        setCampaigns(camps);
        setActiveCampaignCount(activeCount);
        setNewApplicantCount(newApps);
        setApprovedContentCount(approvedContents);
        setLoading(false);
      });

      return () => unsubApps();
    });

    return () => unsubCamps();
  }, []);

  const filteredCampaigns = campaigns.filter(camp => {
    if (activeTab === 'all') return true;
    if (activeTab === 'recruiting') return ['recruiting', 'active'].includes(camp.status);
    if (activeTab === 'active') return ['progress', 'ongoing'].includes(camp.status); // 진행중
    if (activeTab === 'completed') return ['completed', 'closed'].includes(camp.status);
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans">
      {/* Header */}
      <header className="bg-white px-5 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden">
            <span className="font-bold text-blue-600">BR</span>
          </div>
          <h1 className="m-0 text-xl font-bold text-gray-900 tracking-tight">브랜드 대시보드</h1>
        </div>
        <div className="relative cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            🔔
          </div>
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold border-2 border-white">
            3
          </span>
        </div>
      </header>

      <main className="p-5 max-w-5xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-2 relative z-10">
              <Activity size={16} className="text-blue-500" />
              <span className="font-medium">진행중 캠페인</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 relative z-10">{activeCampaignCount}<span className="text-xs md:text-sm font-normal text-gray-400 ml-1">건</span></div>
          </div>
          
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-2 relative z-10">
              <Users size={16} className="text-emerald-500" />
              <span className="font-medium break-keep">오늘 신규 신청</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 relative z-10">{newApplicantCount}<span className="text-xs md:text-sm font-normal text-gray-400 ml-1">명</span></div>
          </div>
          
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-2 relative z-10">
              <CheckCircle size={16} className="text-purple-500" />
              <span className="font-medium break-keep">이번 달 승인</span>
            </div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 relative z-10">{approvedContentCount}<span className="text-xs md:text-sm font-normal text-gray-400 ml-1">건</span></div>
          </div>
        </div>

        {/* Campaign Table Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-gray-900 m-0">캠페인 현황</h2>
            
            {/* Filter Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
              <button 
                onClick={() => setActiveTab('all')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                전체
              </button>
              <button 
                onClick={() => setActiveTab('recruiting')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors ${activeTab === 'recruiting' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                모집중
              </button>
              <button 
                onClick={() => setActiveTab('active')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors ${activeTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                진행중
              </button>
              <button 
                onClick={() => setActiveTab('completed')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs md:text-sm font-medium rounded-lg transition-colors ${activeTab === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                완료
              </button>
            </div>
          </div>

          {filteredCampaigns.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                <BarChart2 size={24} />
              </div>
              <p className="text-gray-500 font-medium">해당하는 캠페인이 없습니다.</p>
              <button 
                onClick={() => navigate('/brand/campaigns/new')}
                className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
              >
                새 캠페인 만들기
              </button>
            </div>
          ) : (
            <div>
              {/* Desktop Table View (Hidden on mobile < 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-medium">캠페인명</th>
                      <th className="px-6 py-4 font-medium">상태</th>
                      <th className="px-6 py-4 font-medium">마감일</th>
                      <th className="px-6 py-4 font-medium">신청자/모집</th>
                      <th className="px-6 py-4 font-medium">제출/승인</th>
                      <th className="px-6 py-4 font-medium text-right">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCampaigns.map(camp => (
                      <tr 
                        key={camp.id} 
                        onClick={() => navigate(`/brand/campaigns/${camp.id}/applicants`)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <p className="font-bold text-gray-900 truncate max-w-xs">{camp.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={camp.status} />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {camp.deadline ? new Date(camp.deadline).toLocaleDateString() : '미정'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="font-bold text-blue-600">{camp.applicantCount}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-600">{camp.participants}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex flex-col text-center">
                              <span className="text-xs text-gray-400">제출</span>
                              <span className="font-medium text-gray-900">{camp.submittedCount}</span>
                            </div>
                            <div className="flex flex-col text-center">
                              <span className="text-xs text-gray-400">승인</span>
                              <span className="font-medium text-purple-600">{camp.approvedCount}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight className="inline-block text-gray-300 group-hover:text-blue-500 transition-colors" size={20} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (Visible on < 768px) */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredCampaigns.map(camp => (
                  <div 
                    key={camp.id}
                    onClick={() => navigate(`/brand/campaigns/${camp.id}/applicants`)}
                    className="p-4 active:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <StatusBadge status={camp.status} />
                      <span className="text-xs text-gray-500">마감: {camp.deadline ? new Date(camp.deadline).toLocaleDateString() : '미정'}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-3 truncate">{camp.name}</h3>
                    
                    <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-3">
                      <div>
                        <p className="text-[10px] text-gray-500 font-medium mb-1">신청/모집인원</p>
                        <p className="text-xs font-bold text-gray-900">
                          <span className="text-blue-600">{camp.applicantCount}</span> / {camp.participants}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 font-medium mb-1">제출/승인완료</p>
                        <p className="text-xs font-bold text-gray-900">
                          {camp.submittedCount} / <span className="text-purple-600">{camp.approvedCount}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Quick Action FAB */}
      <button
        onClick={() => navigate('/brand/campaigns/new')}
        className="fixed bottom-24 right-5 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all z-40"
        aria-label="새 캠페인 등록"
      >
        <Plus size={28} />
      </button>

      <BottomNav />
    </div>
  );
}
