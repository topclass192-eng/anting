import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Product } from '../../components/brand/ProductCard';

const REGIONS = ['전국', '서울', '경기', '인천', '부산', '기타'];
const PLATFORMS = ['인스타그램', '네이버 블로그', '틱톡'];

export default function CampaignRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    productId: '',
    participants: '',
    regions: [] as string[],
    platforms: [] as string[],
    deadline: '',
    requiredText: '',
    forbiddenWords: [] as string[],
    hashtags: [] as string[],
    referenceUrls: [''] as string[],
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [showDraftPopup, setShowDraftPopup] = useState(false);
  const [draftData, setDraftData] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // References for autosave to access latest state
  const formDataRef = useRef(formData);
  const campaignIdRef = useRef(campaignId);
  const isCompletedRef = useRef(isCompleted);
  formDataRef.current = formData;
  campaignIdRef.current = campaignId;
  isCompletedRef.current = isCompleted;

  useEffect(() => {
    fetchProducts();
    checkDraft();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isCompletedRef.current) {
        autoSaveDraft();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const fetchProducts = async () => {
    try {
      const functions = getFunctions();
      const getProducts = httpsCallable(functions, 'getProducts');
      const res = await getProducts({ limit: 100 });
      const data = res.data as { products: Product[] };
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const checkDraft = async () => {
    try {
      const functions = getFunctions();
      const getCampaignDraft = httpsCallable(functions, 'getCampaignDraft');
      const res = await getCampaignDraft();
      const data = res.data as { success: boolean, draft: any };
      
      if (data.success && data.draft) {
        setDraftData(data.draft);
        setShowDraftPopup(true);
      }
    } catch (err) {
      console.error('Failed to fetch draft', err);
    }
  };

  const autoSaveDraft = async (isManual = false) => {
    const data = formDataRef.current;
    if (!data.name && !data.productId && !data.participants && data.regions.length === 0 && data.platforms.length === 0 && !data.deadline) {
      return;
    }

    try {
      const functions = getFunctions();
      const saveCampaignDraft = httpsCallable(functions, 'saveCampaignDraft');
      
      const payload: any = {
        name: data.name,
        productId: data.productId,
        participants: data.participants ? parseInt(data.participants, 10) : null,
        regions: data.regions,
        platforms: data.platforms,
        deadline: data.deadline,
        requiredText: data.requiredText,
        forbiddenWords: data.forbiddenWords,
        hashtags: data.hashtags,
        referenceUrls: data.referenceUrls.filter(url => url.trim() !== ''),
      };

      if (campaignIdRef.current) {
        payload.campaignId = campaignIdRef.current;
      }

      const res = await saveCampaignDraft(payload);
      const resData = res.data as { success: boolean, campaignId: string };
      
      if (resData.success && resData.campaignId) {
        setCampaignId(resData.campaignId);
        showToast('임시저장되었습니다.');
      }
    } catch (err) {
      console.error('Save failed', err);
      if (isManual) alert('저장에 실패했습니다.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleApplyDraft = () => {
    if (draftData) {
      setFormData({
        name: draftData.name || '',
        productId: draftData.productId || '',
        participants: draftData.participants ? String(draftData.participants) : '',
        regions: draftData.regions || [],
        platforms: draftData.platforms || [],
        deadline: draftData.deadline || '',
        requiredText: draftData.requiredText || '',
        forbiddenWords: draftData.forbiddenWords || [],
        hashtags: draftData.hashtags || [],
        referenceUrls: draftData.referenceUrls?.length ? draftData.referenceUrls : [''],
      });
      setCampaignId(draftData.id);
    }
    setShowDraftPopup(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: 'regions' | 'platforms', value: string) => {
    setFormData(prev => {
      const currentList = prev[name];
      if (currentList.includes(value)) {
        return { ...prev, [name]: currentList.filter(item => item !== value) };
      } else {
        return { ...prev, [name]: [...currentList, value] };
      }
    });
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>, fieldName: 'forbiddenWords' | 'hashtags', maxCount: number, prependHash = false) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = e.currentTarget;
      let value = input.value.trim();
      
      if (!value) return;
      
      if (prependHash && !value.startsWith('#')) {
        value = '#' + value;
      }

      setFormData(prev => {
        const currentList = prev[fieldName];
        if (currentList.length >= maxCount) {
          alert(`최대 ${maxCount}개까지만 입력 가능합니다.`);
          return prev;
        }
        if (currentList.includes(value)) return prev; // prevent duplicate
        
        input.value = '';
        return { ...prev, [fieldName]: [...currentList, value] };
      });
    }
  };

  const removeTag = (fieldName: 'forbiddenWords' | 'hashtags', tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: prev[fieldName].filter(tag => tag !== tagToRemove)
    }));
  };

  const handleUrlChange = (index: number, value: string) => {
    setFormData(prev => {
      const newUrls = [...prev.referenceUrls];
      newUrls[index] = value;
      return { ...prev, referenceUrls: newUrls };
    });
  };

  const addUrl = () => {
    setFormData(prev => ({ ...prev, referenceUrls: [...prev.referenceUrls, ''] }));
  };

  const removeUrl = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referenceUrls: prev.referenceUrls.filter((_, i) => i !== index)
    }));
  };

  const getMinDeadline = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const validateStep1 = () => {
    if (!formData.name) return '캠페인명을 입력해주세요.';
    if (!formData.productId) return '연결 제품을 선택해주세요.';
    
    const participantsNum = parseInt(formData.participants, 10);
    if (!formData.participants || isNaN(participantsNum) || participantsNum < 1 || participantsNum > 100) {
      return '모집 인원은 1~100명 사이로 입력해주세요.';
    }
    
    if (formData.regions.length === 0) return '지역 조건을 최소 1개 선택해주세요.';
    if (formData.platforms.length === 0) return '진행 플랫폼을 최소 1개 선택해주세요.';
    if (!formData.deadline) return '마감일을 선택해주세요.';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.requiredText) return '필수 문구를 입력해주세요.';
    
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    for (const url of formData.referenceUrls) {
      if (url.trim() && !urlPattern.test(url.trim())) {
        return '올바른 URL 형식을 입력해주세요.';
      }
    }
    return null;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const error = validateStep1();
      if (error) return alert(error);
    } else if (currentStep === 2) {
      const error = validateStep2();
      if (error) return alert(error);
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleRegister = async () => {
    const s1err = validateStep1();
    if (s1err) { alert(s1err); setCurrentStep(1); return; }
    const s2err = validateStep2();
    if (s2err) { alert(s2err); setCurrentStep(2); return; }

    setIsSubmitting(true);
    try {
      const functions = getFunctions();
      const createCampaign = httpsCallable(functions, 'createCampaign');
      
      const payload: any = {
        name: formData.name,
        productId: formData.productId,
        participants: parseInt(formData.participants, 10),
        regions: formData.regions,
        platforms: formData.platforms,
        deadline: formData.deadline,
        requiredText: formData.requiredText,
        forbiddenWords: formData.forbiddenWords,
        hashtags: formData.hashtags,
        referenceUrls: formData.referenceUrls.filter(url => url.trim() !== ''),
      };

      if (campaignId) {
        payload.campaignId = campaignId;
      }

      const res = await createCampaign(payload);
      const resData = res.data as { success: boolean, campaignId: string };
      
      if (resData.success) {
        setCampaignId(resData.campaignId);
        setIsCompleted(true);
      }
    } catch (err: any) {
      console.error('Failed to register', err);
      alert(err.message || '등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '40px', fontFamily: 'sans-serif', textAlign: 'center', background: '#f9fafb', borderRadius: '8px' }}>
        <div style={{ fontSize: '48px', color: '#10b981', marginBottom: '20px' }}>✓</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>캠페인이 등록되었습니다!</h1>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>인플루언서들이 곧 지원을 시작할 것입니다.</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/brand/dashboard')}
            style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            대시보드로 이동
          </button>
          <button 
            onClick={() => navigate(`/brand/campaigns/${campaignId}/applicants`)}
            style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            신청자 관리 보기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* Draft Popup */}
      {showDraftPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 20px 0', fontSize: '16px' }}>이전에 작성 중인 캠페인이 있습니다. 이어서 작성하시겠습니까?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowDraftPopup(false)}
                style={{ padding: '8px 20px', background: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >새로 작성</button>
              <button 
                onClick={handleApplyDraft}
                style={{ padding: '8px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >이어서 작성</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: '#333', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {toastMessage}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>캠페인 등록</h1>
        <button 
          onClick={() => autoSaveDraft(true)}
          style={{ padding: '8px 16px', background: 'transparent', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '4px', cursor: 'pointer' }}
        >
          임시저장
        </button>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        {[1, 2, 3].map(step => (
          <div key={step} style={{ flex: 1, padding: '10px', textAlign: 'center', background: currentStep >= step ? '#2563eb' : '#e5e7eb', color: currentStep >= step ? 'white' : '#6b7280', borderRadius: '4px', fontWeight: 'bold' }}>
            Step {step}
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>캠페인명 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="캠페인명을 입력해주세요 (최대 50자)"
              maxLength={50}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>연결 제품 선택 *</label>
            <select
              name="productId"
              value={formData.productId}
              onChange={handleChange}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            >
              <option value="">제품을 선택해주세요</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>모집 인원 *</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="number"
                name="participants"
                value={formData.participants}
                onChange={handleChange}
                placeholder="1"
                min={1}
                max={100}
                style={{ width: '100px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
              <span>명 (최대 100명)</span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>지역 조건 * (다중 선택 가능)</label>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {REGIONS.map(region => (
                <label key={region} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.regions.includes(region)}
                    onChange={() => handleCheckboxChange('regions', region)}
                  />
                  {region}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>진행 플랫폼 * (다중 선택 가능)</label>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              {PLATFORMS.map(platform => (
                <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.platforms.includes(platform)}
                    onChange={() => handleCheckboxChange('platforms', platform)}
                  />
                  {platform}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>모집 마감일 *</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              min={getMinDeadline()}
              style={{ width: '200px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

        </div>
      )}

      {currentStep === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>필수 문구 *</label>
            <textarea
              name="requiredText"
              value={formData.requiredText}
              onChange={handleChange}
              placeholder="리뷰에 반드시 포함되어야 할 문구를 입력해주세요 (최대 300자)"
              maxLength={300}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', minHeight: '100px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>금지어 (엔터로 추가, 최대 20개)</label>
            <input
              type="text"
              onKeyDown={(e) => handleTagInput(e, 'forbiddenWords', 20)}
              placeholder="사용하면 안되는 단어를 입력 후 엔터를 치세요"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {formData.forbiddenWords.map(tag => (
                <span key={tag} style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {tag}
                  <button onClick={() => removeTag('forbiddenWords', tag)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: 0 }}>&times;</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>해시태그 (엔터로 추가, 자동 #포함, 최대 30개)</label>
            <div style={{ background: '#f0fdf4', color: '#166534', padding: '10px', borderRadius: '4px', fontSize: '14px', marginBottom: '10px' }}>
              공정거래위원회 지침에 따라 #광고 또는 #협찬이 자동 포함됩니다.
            </div>
            <input
              type="text"
              onKeyDown={(e) => handleTagInput(e, 'hashtags', 30, true)}
              placeholder="예: 안팅화장품 (엔터 시 #안팅화장품 추가)"
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box', marginBottom: '10px' }}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ background: '#f3f4f6', color: '#374151', padding: '4px 8px', borderRadius: '16px', fontSize: '14px' }}>#광고</span>
              <span style={{ background: '#f3f4f6', color: '#374151', padding: '4px 8px', borderRadius: '16px', fontSize: '14px' }}>#협찬</span>
              {formData.hashtags.map(tag => (
                <span key={tag} style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 8px', borderRadius: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {tag}
                  <button onClick={() => removeTag('hashtags', tag)} style={{ background: 'none', border: 'none', color: '#4338ca', cursor: 'pointer', padding: 0 }}>&times;</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>참고 URL</label>
            {formData.referenceUrls.map((url, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  placeholder="https://example.com"
                  style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                />
                <button 
                  onClick={() => removeUrl(index)}
                  disabled={formData.referenceUrls.length === 1}
                  style={{ padding: '0 15px', background: formData.referenceUrls.length === 1 ? '#e5e7eb' : '#fee2e2', color: formData.referenceUrls.length === 1 ? '#9ca3af' : '#b91c1c', border: 'none', borderRadius: '4px', cursor: formData.referenceUrls.length === 1 ? 'not-allowed' : 'pointer' }}
                >
                  삭제
                </button>
              </div>
            ))}
            <button 
              onClick={addUrl}
              style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
            >
              + URL 추가
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Step 1: 기본 정보 요약</h2>
              <button onClick={() => setCurrentStep(1)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}>수정</button>
            </div>
            <p><strong>캠페인명:</strong> {formData.name}</p>
            <p><strong>연결 제품 ID:</strong> {formData.productId}</p>
            <p><strong>모집 인원:</strong> {formData.participants}명</p>
            <p><strong>지역 조건:</strong> {formData.regions.join(', ')}</p>
            <p><strong>진행 플랫폼:</strong> {formData.platforms.join(', ')}</p>
            <p><strong>모집 마감일:</strong> {formData.deadline}</p>
          </div>

          <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Step 2: 가이드라인 요약</h2>
              <button onClick={() => setCurrentStep(2)} style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}>수정</button>
            </div>
            <p><strong>필수 문구:</strong> {formData.requiredText}</p>
            <p><strong>금지어:</strong> {formData.forbiddenWords.join(', ') || '없음'}</p>
            <p><strong>해시태그:</strong> #광고, #협찬, {formData.hashtags.join(', ')}</p>
            <p><strong>참고 URL:</strong> {formData.referenceUrls.filter(u => u.trim() !== '').join(', ') || '없음'}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        <button
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', visibility: currentStep === 1 ? 'hidden' : 'visible' }}
        >
          이전 단계
        </button>
        
        {currentStep < 3 ? (
          <button
            onClick={nextStep}
            style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            다음 단계
          </button>
        ) : (
          <button
            onClick={handleRegister}
            disabled={isSubmitting}
            style={{ padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
          >
            {isSubmitting ? '등록 중...' : '캠페인 등록'}
          </button>
        )}
      </div>
    </div>
  );
}
