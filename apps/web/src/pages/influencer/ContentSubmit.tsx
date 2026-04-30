import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ArrowLeft, Check, AlertCircle, Link as LinkIcon, Camera, Edit3, Video } from 'lucide-react';
import { getAuth } from 'firebase/auth';

export default function ContentSubmit() {
  const { id } = useParams<{ id: string }>(); // applicationId
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);

  const [platform, setPlatform] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  
  // Verification Checks
  const [checkGuide, setCheckGuide] = useState(false);
  const [checkHashtag, setCheckHashtag] = useState(false);
  const [checkAd, setCheckAd] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;
      try {
        const db = getFirestore();
        const appRef = doc(db, 'applications', id);
        const appSnap = await getDoc(appRef);
        
        if (!appSnap.exists()) {
          alert('신청 내역을 찾을 수 없습니다.');
          navigate(-1);
          return;
        }

        const appData = appSnap.data();
        
        if (appData.contentStatus === 'rejected') {
          // If rejected, pre-fill if we want or just show reason
          setPlatform(appData.platform || '');
          setContentUrl(appData.contentUrl || '');
        }

        const campRef = doc(db, 'campaigns', appData.campaignId);
        const campSnap = await getDoc(campRef);
        if (campSnap.exists()) {
          setCampaign({ ...campSnap.data(), application: appData });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  const handleSubmit = async () => {
    if (!platform) {
      alert('콘텐츠를 업로드한 플랫폼을 선택해주세요.');
      return;
    }
    if (!contentUrl.trim()) {
      alert('콘텐츠 URL을 입력해주세요.');
      return;
    }
    if (!checkGuide || !checkHashtag || !checkAd) {
      alert('모든 필수 가이드 체크 항목에 동의해야 제출할 수 있습니다.');
      return;
    }

    setSubmitting(true);
    try {
      const functions = getFunctions();
      const submitContentCall = httpsCallable(functions, 'submitContent');
      await submitContentCall({
        applicationId: id,
        contentUrl,
        platform
      });

      alert('콘텐츠가 성공적으로 제출되었습니다. 검수가 완료될 때까지 기다려주세요.');
      navigate(`/influencer/campaigns/${id}/progress`, { replace: true });
    } catch (error: any) {
      console.error('Content submit failed:', error);
      alert(error.message || '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">콘텐츠 제출</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Info Card */}
        {campaign?.application?.contentStatus === 'rejected' ? (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100 flex gap-3 items-start">
            <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900 mb-1">콘텐츠가 반려되었습니다.</p>
              <p className="text-xs text-red-700 leading-relaxed mb-2">
                사유: {campaign.application.rejectionReason}
              </p>
              <p className="text-[10px] text-red-600 font-bold">
                남은 재제출 기회: {3 - (campaign.application.submissionCount || 1)}회
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex gap-3 items-start">
            <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 leading-relaxed">
              제출하신 URL은 브랜드 관리자의 검수를 거칩니다. 가이드라인을 지키지 않은 경우 페이백이 취소될 수 있으니 제출 전 다시 한번 확인해주세요.
            </p>
          </div>
        )}

        {campaign?.application?.submissionCount >= 3 ? (
          <div className="bg-gray-100 rounded-2xl p-8 text-center border border-gray-200">
            <p className="text-sm font-bold text-gray-900">제출 횟수를 초과했습니다.</p>
            <p className="text-xs text-gray-500 mt-2">최대 3회까지만 제출이 가능합니다.</p>
          </div>
        ) : (
          <>
            {/* Input Form */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-5">
          {/* Platform */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">플랫폼 선택</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'instagram', label: '인스타그램', icon: <Camera size={16} /> },
                { id: 'blog', label: '네이버 블로그', icon: <Edit3 size={16} /> },
                { id: 'tiktok', label: '틱톡', icon: <Video size={16} /> }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border transition-all ${
                    platform === p.id 
                      ? 'border-blue-600 bg-blue-50 text-blue-600 font-bold' 
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {p.icon}
                  <span className="text-xs">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">콘텐츠 URL</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon size={16} className="text-gray-400" />
              </div>
              <input
                type="url"
                placeholder="https://..."
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-900 focus:bg-white transition-colors"
              />
            </div>
            {contentUrl && (
              <p className="text-xs text-gray-500 mt-2 ml-1 truncate">
                입력된 주소: <a href={contentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{contentUrl}</a>
              </p>
            )}
          </div>
        </div>

        {/* Guideline Check */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 mb-2">필수 검수 항목 (직접 확인)</h2>
          
          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition-colors">
            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border ${checkGuide ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white text-transparent'}`}>
              <Check size={14} strokeWidth={3} />
            </div>
            <input type="checkbox" className="hidden" checked={checkGuide} onChange={() => setCheckGuide(!checkGuide)} />
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">필수 문구를 모두 포함했나요?</p>
              <p className="text-xs text-gray-500 line-clamp-2">{campaign?.guide?.content || '캠페인 가이드를 다시 확인해주세요.'}</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition-colors">
            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border ${checkHashtag ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white text-transparent'}`}>
              <Check size={14} strokeWidth={3} />
            </div>
            <input type="checkbox" className="hidden" checked={checkHashtag} onChange={() => setCheckHashtag(!checkHashtag)} />
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">필수 해시태그를 모두 달았나요?</p>
              <p className="text-xs text-gray-500 line-clamp-2">{(campaign?.guide?.hashtags || []).map((h: string) => `#${h}`).join(' ')}</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition-colors">
            <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border ${checkAd ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white text-transparent'}`}>
              <Check size={14} strokeWidth={3} />
            </div>
            <input type="checkbox" className="hidden" checked={checkAd} onChange={() => setCheckAd(!checkAd)} />
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">공정위 문구를 추가했나요?</p>
              <p className="text-xs text-gray-500">예: #광고, #협찬 등</p>
            </div>
          </label>
        </div>
        </>
        )}

        {/* Submit Button */}
        {!(campaign?.application?.submissionCount >= 3) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 pb-safe">
          <button
            onClick={handleSubmit}
            disabled={submitting || !platform || !contentUrl || !checkGuide || !checkHashtag || !checkAd}
            className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-colors disabled:bg-gray-200 disabled:text-gray-400 flex justify-center items-center"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : '최종 제출하기'}
          </button>
        </div>
        )}
      </div>
    </div>
  );
}
