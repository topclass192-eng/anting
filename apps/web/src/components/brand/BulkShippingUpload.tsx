import React, { useRef, useState } from 'react';
import * as xlsx from 'xlsx';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FileUp, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';

interface BulkShippingUploadProps {
  campaignId: string;
  selectedApplications: any[]; // Applications that are selected
  onComplete: () => void;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: { nickname: string; reason: string }[];
}

export default function BulkShippingUpload({ campaignId, selectedApplications, onComplete }: BulkShippingUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = xlsx.utils.sheet_to_json<any>(worksheet, { header: 1 });
      
      // Expected format: Row 0 is header. Data starts from Row 1.
      // Col 0: Nickname, Col 1: Courier, Col 2: Tracking Number
      
      const updates: any[] = [];
      const errors: { nickname: string; reason: string }[] = [];

      // Start from index 1 assuming index 0 is header
      for (let i = 1; i < json.length; i++) {
        const row = json[i];
        if (!row || row.length === 0) continue; // Skip empty rows

        const nickname = row[0]?.toString().trim();
        const shippingCompany = row[1]?.toString().trim();
        const trackingNumber = row[2]?.toString().trim();

        if (!nickname) continue;

        if (!shippingCompany || !trackingNumber) {
          errors.push({ nickname, reason: '택배사 또는 운송장 번호 누락' });
          continue;
        }

        // Find application by nickname
        // Note: selectedApplications should include influencer data joined
        const app = selectedApplications.find(a => a.influencer?.nickname === nickname);
        
        if (!app) {
          errors.push({ nickname, reason: '해당 닉네임의 선발된 신청자를 찾을 수 없음' });
          continue;
        }

        updates.push({
          applicationId: app.id,
          shippingCompany,
          trackingNumber
        });
      }

      if (updates.length > 0) {
        const functions = getFunctions();
        const updateShippingCall = httpsCallable(functions, 'updateShipping');
        await updateShippingCall({
          campaignId,
          updates
        });
      }

      setResult({
        success: updates.length,
        failed: errors.length,
        errors
      });

      if (updates.length > 0) {
        onComplete(); // Trigger refresh
      }

    } catch (error) {
      console.error('Excel parse error:', error);
      alert('엑셀 처리 중 오류가 발생했습니다. 양식을 확인해주세요.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-1.5">
            <FileSpreadsheet size={16} className="text-green-600" />
            엑셀 일괄 업로드
          </h3>
          <p className="text-[10px] text-gray-500">A열: 닉네임 / B열: 택배사 / C열: 운송장번호</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-gray-900 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-black disabled:bg-gray-300"
        >
          {uploading ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <FileUp size={14} />
          )}
          파일 선택
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload} 
          className="hidden" 
        />
      </div>

      {result && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 bg-green-50 text-green-700 p-2 rounded-lg flex items-center gap-2">
              <CheckCircle size={16} />
              <span className="text-xs font-bold">성공 {result.success}건</span>
            </div>
            <div className="flex-1 bg-red-50 text-red-700 p-2 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              <span className="text-xs font-bold">실패 {result.failed}건</span>
            </div>
          </div>
          
          {result.errors.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto text-xs">
              <h4 className="font-bold text-gray-700 mb-2">실패 내역</h4>
              <ul className="space-y-1">
                {result.errors.map((err, idx) => (
                  <li key={idx} className="flex justify-between text-red-600">
                    <span className="font-medium truncate mr-2">{err.nickname}</span>
                    <span className="text-gray-500 shrink-0">{err.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <button 
            onClick={() => setResult(null)}
            className="w-full mt-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center justify-center gap-1"
          >
            <X size={14} /> 닫기
          </button>
        </div>
      )}
    </div>
  );
}
