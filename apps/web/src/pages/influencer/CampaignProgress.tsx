import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ArrowLeft, CheckCircle, Package, Edit3, Send, ChevronRight } from 'lucide-react';
import { getAuth } from 'firebase/auth';

export default function CampaignProgress() {
  const { id } = useParams<{ id: string }>(); // This is applicationId
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchProgressData = async () => {
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
        setApplication(appData);

        const campRef = doc(db, 'campaigns', appData.campaignId);
        const campSnap = await getDoc(campRef);
        if (campSnap.exists()) {
          setCampaign({ id: campSnap.id, ...campSnap.data() });
        }
      } catch (error) {
        console.error('Error fetching progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [id, user, navigate]);

  const handleConfirmDelivery = async () => {
    if (!window.confirm('제품을 무사히 수령하셨나요?')) return;
    
    setConfirming(true);
    try {
      const functions = getFunctions();
      const confirmDeliveryCall = httpsCallable(functions, 'confirmDelivery');
      await confirmDeliveryCall({ applicationId: id });
      
      alert('수령 확인이 완료되었습니다. 멋진 콘텐츠를 기대할게요!');
      
      // Update local state to reflect change immediately
      setApplication((prev: any) => ({
        ...prev,
        contentStatus: 'writing'
      }));
    } catch (error: any) {
      console.error('Confirm delivery failed:', error);
      alert(error.message || '오류가 발생했습니다.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Determine current active step
  const getStepIndex = () => {
    if (application?.contentStatus === 'approved') return 5; // 승인 완료
    if (application?.contentStatus === 'submitted') return 4; // 제출 완료
    if (application?.contentStatus === 'writing' || application?.contentStatus === 'rejected') return 3; // 콘텐츠 작성/재작성 중
    if (application?.trackingNumber) return 2; // 배송 중 (수령 확인 가능)
    if (application?.status === 'selected') return 1; // 선발 완료 (배송 대기)
    return 0; // 대기중/탈락 등
  };

  const currentStep = getStepIndex();

  const steps = [
    { title: '선발 완료', desc: '캠페인에 선발되었습니다.', icon: <CheckCircle size={20} /> },
    { 
      title: '배송 중', 
      desc: application?.trackingNumber ? `${application.shippingCompany} ${application.trackingNumber}` : '브랜드에서 배송을 준비 중입니다.', 
      icon: <Package size={20} /> 
    },
    { 
      title: '수령 확인', 
      desc: '제품을 받으시면 수령 확인을 눌러주세요.', 
      icon: <CheckCircle size={20} />,
      action: () => (
        <button 
          onClick={handleConfirmDelivery}
          disabled={confirming || currentStep !== 2}
          className={`mt-3 w-full py-2.5 rounded-xl text-sm font-bold transition-colors flex justify-center items-center ${
            currentStep === 2 
              ? 'bg-gray-900 text-white hover:bg-black' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {confirming ? (
             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : '제품 수령 확인'}
        </button>
      )
    },
    { 
      title: '콘텐츠 작성 중', 
      desc: application?.contentStatus === 'rejected' ? '콘텐츠가 반려되었습니다. 사유를 확인하고 다시 제출해주세요.' : '가이드에 맞춰 콘텐츠를 작성해주세요.', 
      icon: <Edit3 size={20} />,
      action: () => (
        <button 
          onClick={() => navigate(`/influencer/campaigns/${id}/submit`)}
          disabled={currentStep < 3 || currentStep === 5 || application?.submissionCount >= 3}
          className={`mt-3 w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
            currentStep === 3 
              ? (application?.contentStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700') 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {application?.submissionCount >= 3 ? '제출 횟수 초과' : application?.contentStatus === 'rejected' ? '콘텐츠 다시 제출하기' : '콘텐츠 제출하기'}
        </button>
      )
    },
    { 
      title: '제출 완료', 
      desc: application?.contentStatus === 'submitted' ? '콘텐츠 검수를 기다리고 있어요.' : (application?.contentStatus === 'approved' ? '콘텐츠 승인이 완료되었습니다.' : ''), 
      icon: <Send size={20} /> 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">캠페인 진행 현황</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Campaign Info Card */}
        {campaign && (
          <div 
            onClick={() => navigate(`/campaigns/${campaign.id}`)}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-4 items-center cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
              {campaign.productImageUrl && <img src={campaign.productImageUrl} alt={campaign.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 mb-1">{campaign.brandName}</p>
              <h2 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-1">
                {campaign.name}
              </h2>
            </div>
            <ChevronRight size={20} className="text-gray-400 shrink-0" />
          </div>
        )}

        {/* Vertical Stepper */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-4">
            {steps.map((step, idx) => {
              // Note: idx is 0-based. 
              // step 0: 선발, step 1: 배송, step 2: 수령, step 3: 작성, step 4: 완료
              // However, our step indexes defined in getStepIndex: 
              // 1: 선발, 2: 배송, 3: 작성, 4: 제출
              // Let's map step to getStepIndex correctly.
              const stepLogicIndex = idx === 0 ? 1 : idx === 1 ? 2 : idx === 2 ? 3 : idx === 3 ? 3 : 4; 
              // Actually, better to just compare directly against idx+1 loosely.
              
              const stepNumber = idx + 1;
              const isCompleted = currentStep > stepNumber || (currentStep === 4);
              const isActive = currentStep === stepNumber || (idx === 2 && currentStep === 2) || (idx === 3 && currentStep === 3);
              const isPending = currentStep < stepNumber && !isActive;

              let iconColorClass = 'text-gray-400';
              let bgColorClass = 'bg-gray-100';
              let borderColorClass = 'border-gray-100';

              if (isCompleted) {
                iconColorClass = 'text-blue-600';
                bgColorClass = 'bg-blue-50';
                borderColorClass = 'border-blue-600';
              } else if (isActive) {
                iconColorClass = 'text-white';
                bgColorClass = 'bg-blue-600 shadow-md shadow-blue-200';
                borderColorClass = 'border-blue-600';
              }

              return (
                <div key={idx} className="relative pl-8">
                  {/* Step Marker */}
                  <div 
                    className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full flex items-center justify-center ${bgColorClass} ring-4 ring-white z-10 transition-colors`}
                  >
                    {isActive ? (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    ) : isCompleted ? (
                      <CheckCircle size={12} className="text-blue-600" />
                    ) : null}
                  </div>

                  {/* Active line connecting past completed steps */}
                  {isCompleted && idx < steps.length - 1 && (
                    <div className="absolute -left-[2px] top-5 w-0.5 h-[calc(100%+32px)] bg-blue-600 -z-0"></div>
                  )}

                  <div className={`transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={iconColorClass}>{step.icon}</div>
                      <h3 className={`font-bold text-sm ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                        {step.title}
                      </h3>
                    </div>
                    {step.desc && (
                      <p className="text-xs text-gray-500 mt-1">{step.desc}</p>
                    )}
                    {step.action && step.action()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
