import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ArrowLeft, Search, Truck } from 'lucide-react';
import BulkShippingUpload from '../../components/brand/BulkShippingUpload';
import ShippingStatus from '../../components/common/ShippingStatus';

export default function ShippingInput() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  
  // Single input state
  const [selectedAppId, setSelectedAppId] = useState('');
  const [shippingCompany, setShippingCompany] = useState('CJ대한통운');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSelectedApplicants = async () => {
    setLoading(true);
    try {
      const functions = getFunctions();
      const getAppsCall = httpsCallable(functions, 'getApplications');
      
      const response = await getAppsCall({
        campaignId: id,
        status: 'selected' // Only fetch selected
      });

      const data = response.data as any;
      setApplications(data.applications);
      if (data.applications.length > 0 && !selectedAppId) {
        setSelectedAppId(data.applications[0].id);
      }
    } catch (error) {
      console.error('Error fetching selected applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSelectedApplicants();
    }
  }, [id]);

  const handleSingleSave = async () => {
    if (!selectedAppId || !trackingNumber.trim()) {
      alert('운송장 번호를 입력해주세요.');
      return;
    }

    if (!/^[0-9]+$/.test(trackingNumber)) {
      alert('운송장 번호는 숫자만 입력 가능합니다.');
      return;
    }

    setSaving(true);
    try {
      const functions = getFunctions();
      const updateShippingCall = httpsCallable(functions, 'updateShipping');
      
      await updateShippingCall({
        campaignId: id,
        updates: [{
          applicationId: selectedAppId,
          shippingCompany,
          trackingNumber
        }]
      });

      alert('운송장 정보가 저장되었습니다.');
      setTrackingNumber('');
      fetchSelectedApplicants(); // Refresh list to show updated status
    } catch (error: any) {
      console.error('Save failed:', error);
      alert(error.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
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
          <h1 className="text-lg font-bold text-gray-900 ml-2">운송장 입력</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Bulk Upload Section */}
        <BulkShippingUpload 
          campaignId={id!} 
          selectedApplications={applications} 
          onComplete={fetchSelectedApplicants} 
        />

        {/* Single Input Section */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-1.5">
            <Truck size={16} className="text-blue-600" />
            단건 입력
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">인플루언서 선택</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
              >
                {applications.map(app => (
                  <option key={app.id} value={app.id}>
                    {app.influencer?.nickname || '알 수 없음'} {app.trackingNumber ? '(입력완료)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <div className="w-1/3">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">택배사</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  value={shippingCompany}
                  onChange={(e) => setShippingCompany(e.target.value)}
                >
                  <option value="CJ대한통운">CJ대한통운</option>
                  <option value="롯데택배">롯데택배</option>
                  <option value="한진택배">한진택배</option>
                  <option value="우체국택배">우체국택배</option>
                  <option value="로젠택배">로젠택배</option>
                </select>
              </div>
              <div className="w-2/3">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">운송장 번호</label>
                <input 
                  type="text" 
                  placeholder="- 없이 숫자만 입력" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-900"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
            </div>

            <button 
              onClick={handleSingleSave}
              disabled={saving}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-300 flex justify-center items-center"
            >
              {saving ? (
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : '저장하기'}
            </button>
          </div>
        </div>

        {/* Selected List & Status */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-3 px-1">입력 현황 ({applications.filter(a => a.trackingNumber).length}/{applications.length})</h2>
          
          {loading ? (
            <div className="py-10 text-center text-gray-400">데이터를 불러오는 중입니다...</div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-2xl py-10 text-center border border-gray-100">
              <Search size={24} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">선발된 인플루언서가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map(app => (
                <div key={app.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                        {app.influencer?.profileImage ? (
                          <img src={app.influencer.profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-gray-100 text-xs">
                            {app.influencer?.nickname?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 text-sm">{app.influencer?.nickname || '알 수 없음'}</span>
                    </div>
                    
                    {app.trackingNumber ? (
                      <div className="text-right">
                        <div className="text-xs font-bold text-gray-900">{app.shippingCompany}</div>
                        <div className="text-xs text-blue-600 font-medium">{app.trackingNumber}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded">미입력</span>
                    )}
                  </div>
                  
                  <div className="mt-2 pt-3 border-t border-gray-50">
                    <ShippingStatus status={app.trackingNumber ? 'shipped' : 'preparing'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
