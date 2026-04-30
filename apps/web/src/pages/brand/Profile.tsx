import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import ImageUpload from '../../components/common/ImageUpload';

const CATEGORIES = ['뷰티', '식품', '생활', '패션', '육아', '기타'];

export default function Profile() {
  const navigate = useNavigate();
  const auth = getAuth();
  
  const [formData, setFormData] = useState({
    companyName: '',
    category: '',
    contactName: '',
    contactPhone: '',
    description: '',
    logoUrl: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const formatPhone = (value: string) => {
    const cleaned = ('' + value).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{0,4})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join('-');
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, contactPhone: formatted });
  };

  const validateField = (name: string, value: string) => {
    let error = '';
    switch (name) {
      case 'companyName':
        if (!value.trim()) error = '회사명을 입력해주세요.';
        else if (value.length > 50) error = '회사명은 최대 50자까지 가능합니다.';
        break;
      case 'category':
        if (!value) error = '카테고리를 선택해주세요.';
        else if (!CATEGORIES.includes(value)) error = '유효한 카테고리를 선택해주세요.';
        break;
      case 'contactName':
        if (!value.trim()) error = '담당자명을 입력해주세요.';
        else if (value.length > 20) error = '담당자명은 최대 20자까지 가능합니다.';
        break;
      case 'contactPhone':
        if (!value) error = '연락처를 입력해주세요.';
        else if (!/^010-\d{4}-\d{4}$/.test(value)) error = '올바른 연락처 형식(010-0000-0000)으로 입력해주세요.';
        break;
      case 'description':
        if (value.length > 200) error = '회사 소개는 최대 200자까지 입력 가능합니다.';
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateForm = () => {
    const isCompanyNameValid = validateField('companyName', formData.companyName);
    const isCategoryValid = validateField('category', formData.category);
    const isContactNameValid = validateField('contactName', formData.contactName);
    const isContactPhoneValid = validateField('contactPhone', formData.contactPhone);
    const isDescriptionValid = validateField('description', formData.description);

    return isCompanyNameValid && isCategoryValid && isContactNameValid && isContactPhoneValid && isDescriptionValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const functions = getFunctions();
      const updateBrand = httpsCallable(functions, 'updateBrand');
      
      const response = await updateBrand(formData);
      const data = response.data as { success: boolean; message: string };
      
      if (data.success) {
        navigate('/brand/dashboard');
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      setGlobalError(error.message || '프로필 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSuccess = (url: string | string[]) => {
    setFormData(prev => ({ ...prev, logoUrl: url as string }));
  };

  const handleImageError = (msg: string) => {
    setGlobalError(msg);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>브랜드 프로필 설정</h1>
      
      {globalError && (
        <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '4px', marginBottom: '20px', textAlign: 'center' }}>
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* 로고 이미지 업로드 (선택) */}
        <ImageUpload
          value={formData.logoUrl}
          onChange={handleImageSuccess}
          onError={handleImageError}
          pathGenerator={(file) => `brands/${auth.currentUser?.uid || 'temp-brand-id'}/logo.${file.name.split('.').pop()}`}
        />

        {/* 회사명 (필수) */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>회사명 *</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            placeholder="회사명 입력 (최대 50자)"
            maxLength={50}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${errors.companyName ? '#ef4444' : '#ccc'}`, boxSizing: 'border-box' }}
          />
          {errors.companyName && <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.companyName}</p>}
        </div>

        {/* 카테고리 (필수) */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>카테고리 *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${errors.category ? '#ef4444' : '#ccc'}`, boxSizing: 'border-box' }}
          >
            <option value="">카테고리 선택</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.category}</p>}
        </div>

        {/* 담당자명 (필수) */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>담당자명 *</label>
          <input
            type="text"
            name="contactName"
            value={formData.contactName}
            onChange={handleChange}
            placeholder="담당자 이름 입력 (최대 20자)"
            maxLength={20}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${errors.contactName ? '#ef4444' : '#ccc'}`, boxSizing: 'border-box' }}
          />
          {errors.contactName && <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.contactName}</p>}
        </div>

        {/* 연락처 (필수) */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>연락처 *</label>
          <input
            type="text"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handlePhoneChange}
            placeholder="010-0000-0000"
            maxLength={13}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${errors.contactPhone ? '#ef4444' : '#ccc'}`, boxSizing: 'border-box' }}
          />
          {errors.contactPhone && <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.contactPhone}</p>}
        </div>

        {/* 회사 소개 (선택) */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>회사 소개 (선택)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="간단한 회사 소개를 입력해주세요. (최대 200자)"
            maxLength={200}
            rows={4}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${errors.description ? '#ef4444' : '#ccc'}`, boxSizing: 'border-box', resize: 'vertical' }}
          />
          {errors.description && <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.description}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '12px',
            background: isSubmitting ? '#9ca3af' : '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s ease'
          }}
        >
          {isSubmitting ? '저장 중...' : '프로필 저장'}
        </button>
      </form>
    </div>
  );
}
