import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ChevronLeft, Calendar, Users, AlertCircle, CheckCircle, MapPin, Camera, LayoutList } from 'lucide-react';

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
  guideText?: string;
  forbiddenWords?: string[];
  hashtags?: string[];
  referenceUrls?: string[];
}

export const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  
  // Application modal state
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;
      try {
        const db = getFirestore();
        const docRef = doc(db, 'campaigns', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setCampaign({ id: docSnap.id, ...docSnap.data() } as Campaign);
        } else {
          setErrorMsg('캠페인을 찾을 수 없습니다.');
        }
      } catch (error) {
        console.error('Error fetching campaign detail:', error);
        setErrorMsg('캠페인 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id]);

  const handleApply = async () => {
    if (!campaign || applying) return;
    setApplying(true);
    setErrorMsg('');

    try {
      const functions = getFunctions();
      const applyFn = httpsCallable(functions, 'apply');
      const result = await applyFn({ campaignId: campaign.id });
      const data = result.data as any;

      if (data.error) {
        setErrorMsg(data.message);
      } else if (data.success) {
        setShowModal(true);
      }
    } catch (error: any) {
      console.error('Application error:', error);
      setErrorMsg('신청 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!campaign && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <p className="text-gray-600 mb-4">{errorMsg}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-900 text-white rounded-lg">뒤로가기</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      {/* App Bar */}
      <div className="absolute top-0 w-full z-10 px-4 py-3 flex items-center bg-gradient-to-b from-black/50 to-transparent text-white">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-colors">
          <ChevronLeft size={24} />
        </button>
      </div>

      {/* Image Header */}
      <div className="w-full aspect-square bg-gray-200 relative">
        {campaign?.productImageUrl ? (
          <img src={campaign.productImageUrl} alt={campaign.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100">
            <LayoutList size={48} />
          </div>
        )}
      </div>

      {/* Basic Info */}
      <div className="bg-white px-5 py-6 rounded-t-3xl -mt-6 relative shadow-sm">
        <p className="text-sm font-medium text-gray-500 mb-2">{campaign?.brandName}</p>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-4">{campaign?.name}</h1>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {campaign?.platforms?.map(p => (
            <span key={p} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium flex items-center">
              {p.includes('인스타') && <Camera size={12} className="mr-1" />}
              {p}
            </span>
          ))}
          <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium">
            {campaign?.category}
          </span>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center text-gray-700">
            <Calendar size={18} className="mr-3 text-gray-400" />
            <span className="w-20 text-gray-500">마감일</span>
            <span className="font-medium text-gray-900">{campaign?.deadline}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Users size={18} className="mr-3 text-gray-400" />
            <span className="w-20 text-gray-500">모집 현황</span>
            <span className="font-medium">
              <span className="text-blue-600">{campaign?.currentApplicants || 0}명</span> / {campaign?.recruitmentCount}명
            </span>
          </div>
          {campaign?.regions && campaign.regions.length > 0 && (
            <div className="flex items-start text-gray-700">
              <MapPin size={18} className="mr-3 text-gray-400 mt-0.5" />
              <span className="w-20 text-gray-500 shrink-0">활동 지역</span>
              <span className="font-medium text-gray-900 leading-relaxed">
                {campaign.regions.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Guide Lines */}
      <div className="mt-2 bg-white px-5 py-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-5">원고 가이드</h2>
        
        <div className="space-y-6">
          {campaign?.guideText && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                필수 안내 사항
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {campaign.guideText}
              </div>
            </div>
          )}

          {campaign?.hashtags && campaign.hashtags.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></div>
                필수 해시태그
              </h3>
              <div className="flex flex-wrap gap-2">
                {campaign.hashtags.map(tag => (
                  <span key={tag} className="text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-start">
                <AlertCircle size={12} className="mr-1 mt-0.5 shrink-0" />
                공정거래위원회 지침에 따라 #광고 또는 #협찬 태그가 필수로 포함되어야 합니다.
              </p>
            </div>
          )}

          {campaign?.forbiddenWords && campaign.forbiddenWords.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-red-600 mb-2 flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2"></div>
                금지어
              </h3>
              <div className="flex flex-wrap gap-2">
                {campaign.forbiddenWords.map(word => (
                  <span key={word} className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message area just above the button */}
      {errorMsg && (
        <div className="fixed bottom-24 left-0 w-full px-4 z-40">
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl shadow-lg text-sm flex items-center border border-red-100 animate-fade-in-up">
            <AlertCircle size={16} className="mr-2 shrink-0" />
            {errorMsg}
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 pb-safe z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handleApply}
          disabled={applying || campaign?.status !== 'active'}
          className={`w-full py-4 rounded-xl font-bold text-lg flex justify-center items-center transition-all ${
            campaign?.status !== 'active' 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : applying
                ? 'bg-gray-800 text-white opacity-80'
                : 'bg-gray-900 text-white hover:bg-black active:scale-[0.98] shadow-md hover:shadow-lg'
          }`}
        >
          {applying ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : campaign?.status !== 'active' ? (
            '마감된 캠페인'
          ) : (
            '캠페인 신청하기'
          )}
        </button>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl animate-scale-up">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-green-500">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">신청이 완료되었습니다!</h3>
            <p className="text-gray-500 text-sm mb-8">
              브랜드에서 인플루언서님의 프로필을 검토한 후<br/>최종 선정 결과를 안내해 드립니다.
            </p>
            <button
              onClick={() => navigate('/influencer/campaigns')}
              className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetail;
