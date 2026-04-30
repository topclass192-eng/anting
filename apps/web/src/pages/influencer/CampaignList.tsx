import React, { useState, useEffect, useRef, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getFunctions } from 'firebase/functions';
import { Search, MapPin, Calendar, Users, Camera, LayoutList } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Campaign {
  id: string;
  name: string;
  brandName: string;
  productImageUrl?: string;
  recruitmentCount: number;
  currentApplicants: number;
  deadline: string;
  platforms: string[];
  regions: string[];
  status: string;
  category: string;
}

const CATEGORIES = ['전체', '뷰티', '식품', '생활', '패션', '육아', '기타'];
const REGIONS = ['전체', '전국', '서울', '경기', '인천', '부산', '기타'];
const PLATFORMS = ['전체', '인스타그램', '네이버 블로그', '틱톡'];

export const CampaignList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [selectedPlatform, setSelectedPlatform] = useState('전체');
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const observer = useRef<IntersectionObserver | null>(null);

  const fetchCampaigns = async (isLoadMore = false) => {
    if (loading || (!hasMore && isLoadMore)) return;
    
    setLoading(true);
    try {
      const functions = getFunctions();
      const getCampaignsFn = httpsCallable(functions, 'getCampaigns');
      
      const params: any = {
        pageSize: 10,
        category: selectedCategory !== '전체' ? selectedCategory : undefined,
        region: selectedRegion !== '전체' ? selectedRegion : undefined,
        platform: selectedPlatform !== '전체' ? selectedPlatform : undefined,
      };

      if (isLoadMore && lastVisibleId) {
        params.lastVisibleId = lastVisibleId;
      }

      const result = await getCampaignsFn(params);
      const data = result.data as any;

      if (data.success) {
        // Filter by searchTerm locally since Firestore doesn't support full-text search out of the box
        let fetchedCampaigns = data.data.campaigns;
        if (searchTerm) {
          fetchedCampaigns = fetchedCampaigns.filter((c: Campaign) => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (c.brandName && c.brandName.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }

        setCampaigns(prev => isLoadMore ? [...prev, ...fetchedCampaigns] : fetchedCampaigns);
        setLastVisibleId(data.data.lastVisible);
        setHasMore(data.data.hasMore);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLastVisibleId(null);
    setHasMore(true);
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedRegion, selectedPlatform, searchTerm]);

  const lastCampaignElementRef = useCallback((node: HTMLAnchorElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchCampaigns(true);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const calculateDday = (deadline: string) => {
    const today = new Date();
    const target = new Date(deadline);
    const diff = target.getTime() - today.getTime();
    const dDay = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return dDay >= 0 ? `D-${dDay}` : '마감';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Header & Search */}
      <div className="bg-white sticky top-0 z-10 shadow-sm pt-4">
        <div className="px-4 pb-2">
          <h1 className="text-xl font-bold mb-4 text-gray-900">캠페인 탐색</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="캠페인명 또는 브랜드 검색"
              className="w-full pl-10 pr-4 py-3 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* Categories Tab */}
        <div className="flex overflow-x-auto px-4 py-3 no-scrollbar space-x-2 border-b border-gray-100">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex px-4 py-3 space-x-2 bg-white border-b border-gray-100">
          <select 
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="전체">지역: 전체</option>
            {REGIONS.slice(1).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 outline-none focus:ring-1 focus:ring-gray-900"
          >
            <option value="전체">플랫폼: 전체</option>
            {PLATFORMS.slice(1).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Campaign List */}
      <div className="p-4 space-y-4">
        {campaigns.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-500">
            조건에 맞는 캠페인이 없습니다.
          </div>
        )}

        {campaigns.map((campaign, index) => {
          const isLast = index === campaigns.length - 1;
          const currentApplicants = campaign.currentApplicants || 0;
          const ratio = currentApplicants / campaign.recruitmentCount;
          const isClosingSoon = calculateDday(campaign.deadline).includes('D-') && parseInt(calculateDday(campaign.deadline).replace('D-', '')) <= 3;

          return (
            <Link 
              to={`/campaigns/${campaign.id}`} 
              key={campaign.id}
              ref={isLast ? lastCampaignElementRef : null}
              className="block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform"
            >
              <div className="flex p-4 gap-4">
                {/* Thumbnail */}
                <div className="w-24 h-24 rounded-xl bg-gray-100 shrink-0 overflow-hidden relative">
                  {campaign.productImageUrl ? (
                    <img src={campaign.productImageUrl} alt={campaign.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <LayoutList size={24} />
                    </div>
                  )}
                  {isClosingSoon && (
                    <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg">
                      마감임박
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1 truncate">{campaign.brandName || '브랜드명'}</p>
                    <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight mb-2">
                      {campaign.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-wrap gap-1">
                      {campaign.platforms?.map((p) => (
                        <span key={p} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded flex items-center">
                          {p.includes('인스타') ? <Camera size={10} className="mr-0.5" /> : null}
                          {p}
                        </span>
                      ))}
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <span className={`text-xs font-bold ${isClosingSoon ? 'text-red-500' : 'text-blue-600'}`}>
                        {calculateDday(campaign.deadline)}
                      </span>
                      <span className="text-[10px] text-gray-500 flex items-center mt-0.5">
                        <Users size={10} className="mr-0.5" />
                        <span className={ratio >= 1 ? 'text-green-500 font-medium' : ''}>
                          {currentApplicants}
                        </span>
                        /{campaign.recruitmentCount}명
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {loading && (
          <div className="py-4 text-center">
            <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignList;
