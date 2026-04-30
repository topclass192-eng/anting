import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ArrowLeft, Check, X, Link as LinkIcon, AlertCircle, FileText, ExternalLink } from 'lucide-react';

export default function ContentReview() {
  const { id } = useParams<{ id: string }>(); // campaignId
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  
  // Rejection Modal State
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const functions = getFunctions();
      const getAppsCall = httpsCallable(functions, 'getApplications');
      
      const response = await getAppsCall({
        campaignId: id,
        status: 'selected' // Only fetch selected
      });

      const data = response.data as any;
      // Filter out apps that haven't submitted anything yet
      const submittedApps = data.applications.filter((a: any) => 
        ['submitted', 'rejected', 'approved'].includes(a.contentStatus)
      );
      
      setApplications(submittedApps);
    } catch (error) {
      console.error('Error fetching applications for review:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchApplications();
    }
  }, [id]);

  const handleApprove = async (applicationId: string) => {
    if (!window.confirm('승인하시겠습니까? (이후 취소할 수 없습니다)')) return;

    setProcessing(true);
    try {
      const functions = getFunctions();
      const approveContentCall = httpsCallable(functions, 'approveContent');
      await approveContentCall({ applicationId, campaignId: id });
      
      alert('승인되었습니다.');
      fetchApplications();
    } catch (error: any) {
      console.error('Approve failed:', error);
      alert(error.message || '오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectionModal = (applicationId: string) => {
    setSelectedAppId(applicationId);
    setRejectionReason('');
    setRejectionModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    if (rejectionReason.length > 200) {
      alert('사유는 200자 이내로 작성해주세요.');
      return;
    }

    setProcessing(true);
    try {
      const functions = getFunctions();
      const rejectContentCall = httpsCallable(functions, 'rejectContent');
      await rejectContentCall({ 
        applicationId: selectedAppId, 
        campaignId: id,
        rejectionReason 
      });
      
      alert('반려 처리되었습니다.');
      setRejectionModalOpen(false);
      fetchApplications();
    } catch (error: any) {
      console.error('Reject failed:', error);
      alert(error.message || '오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center px-4 h-14">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">콘텐츠 검수</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="py-10 text-center text-gray-400">데이터를 불러오는 중입니다...</div>
        ) : applications.length === 0 ? (
          <div className="bg-white rounded-2xl py-10 text-center border border-gray-100 shadow-sm">
            <FileText size={24} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">아직 제출된 콘텐츠가 없습니다.</p>
          </div>
        ) : (
          applications.map(app => (
            <div key={app.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden">
                    {app.influencer?.profileImage ? (
                      <img src={app.influencer.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">
                        {app.influencer?.nickname?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{app.influencer?.nickname || '알 수 없음'}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="uppercase font-medium text-blue-600">{app.platform}</span>
                      <span>•</span>
                      <span>제출 횟수: {app.submissionCount || 1}/3</span>
                    </div>
                  </div>
                </div>
                
                {/* Status Badge */}
                {app.contentStatus === 'approved' && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">승인 완료</span>
                )}
                {app.contentStatus === 'rejected' && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">반려됨</span>
                )}
                {app.contentStatus === 'submitted' && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">검수 대기</span>
                )}
              </div>

              {/* Content Link */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-500 mb-1">제출된 링크</p>
                <a 
                  href={app.contentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1.5 break-all"
                >
                  <LinkIcon size={14} className="shrink-0" />
                  {app.contentUrl}
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </div>

              {/* Rejected Reason Display */}
              {app.contentStatus === 'rejected' && app.rejectionReason && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-100 flex gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p>{app.rejectionReason}</p>
                </div>
              )}

              {/* Actions */}
              {app.contentStatus === 'submitted' && (
                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  <button 
                    onClick={() => openRejectionModal(app.id)}
                    className="flex-1 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X size={16} />
                    반려
                  </button>
                  <button 
                    onClick={() => handleApprove(app.id)}
                    className="flex-1 py-2.5 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check size={16} />
                    승인
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
            <h2 className="text-lg font-bold text-gray-900 mb-2">콘텐츠 반려</h2>
            <p className="text-sm text-gray-500 mb-4">인플루언서가 확인하고 재제출할 수 있도록 반려 사유를 상세히 적어주세요. (최대 200자)</p>
            
            <textarea 
              className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none outline-none focus:border-red-500 focus:bg-white transition-colors"
              placeholder="예: 필수 해시태그 #앤팅 이 누락되었습니다."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              maxLength={200}
            />
            <div className="text-right text-[10px] text-gray-400 mt-1 mb-6">
              {rejectionReason.length} / 200
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setRejectionModalOpen(false)}
                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:bg-red-300 flex justify-center items-center"
              >
                {processing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : '반려하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
