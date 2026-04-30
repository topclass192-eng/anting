import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import ImageUpload from '../../components/common/ImageUpload';

const CATEGORIES = ['뷰티', '식품', '생활', '패션', '육아', '기타'];

export default function ProductRegister() {
  const navigate = useNavigate();
  const [productId, setProductId] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    images: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  useEffect(() => {
    // 임시 ID 생성 (storage path 및 문서 ID로 사용)
    setProductId(crypto.randomUUID());
  }, []);

  const formatPrice = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPrice(e.target.value);
    setFormData(prev => ({ ...prev, price: formatted }));
    validateField('price', formatted);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const validateField = (name: string, value: string | string[]) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value || typeof value !== 'string' || !value.trim()) error = '제품명을 입력해주세요.';
        else if (value.length > 50) error = '제품명은 최대 50자까지 가능합니다.';
        break;
      case 'category':
        if (!value) error = '카테고리를 선택해주세요.';
        else if (typeof value === 'string' && !CATEGORIES.includes(value)) error = '유효한 카테고리를 선택해주세요.';
        break;
      case 'description':
        if (!value || typeof value !== 'string' || !value.trim()) error = '제품 설명을 입력해주세요.';
        else if (value.length > 500) error = '제품 설명은 최대 500자까지 가능합니다.';
        break;
      case 'price':
        const numValue = parseInt((value as string).replace(/,/g, ''), 10);
        if (!value) error = '소비자가를 입력해주세요.';
        else if (isNaN(numValue) || numValue < 0) error = '올바른 금액을 입력해주세요.';
        break;
      case 'images':
        if (!value || (Array.isArray(value) && value.length === 0)) error = '최소 1장의 이미지가 필요합니다.';
        else if (Array.isArray(value) && value.length > 5) error = '이미지는 최대 5장까지 가능합니다.';
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleImageChange = (urls: string | string[]) => {
    const imagesArray = Array.isArray(urls) ? urls : [urls];
    setFormData(prev => ({ ...prev, images: imagesArray }));
    validateField('images', imagesArray);
  };

  const validateForm = () => {
    const isNameValid = validateField('name', formData.name);
    const isCategoryValid = validateField('category', formData.category);
    const isDescValid = validateField('description', formData.description);
    const isPriceValid = validateField('price', formData.price);
    const isImagesValid = validateField('images', formData.images);

    return isNameValid && isCategoryValid && isDescValid && isPriceValid && isImagesValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const functions = getFunctions();
      const createProduct = httpsCallable(functions, 'createProduct');
      
      const payload = {
        productId,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        price: parseInt(formData.price.replace(/,/g, ''), 10),
        images: formData.images
      };
      
      const response = await createProduct(payload);
      const data = response.data as { success: boolean };
      
      if (data.success) {
        navigate('/brand/products');
      }
    } catch (error: any) {
      console.error('Save failed:', error);
      setGlobalError(error.message || '제품 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>제품 등록</h1>
      
      {globalError && (
        <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '4px', marginBottom: '20px' }}>
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div>
          <ImageUpload
            multiple={true}
            maxImages={5}
            value={formData.images}
            onChange={handleImageChange}
            onError={setGlobalError}
            pathGenerator={(file, index) => `products/${productId}/images/${index}.${file.name.split('.').pop()}`}
          />
          {errors.images && <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.images}</p>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>제품명 *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="제품명 입력 (최대 50자)"
            maxLength={50}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${errors.name ? '#ef4444' : '#ccc'}`, boxSizing: 'border-box' }}
          />
          {errors.name && <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.name}</p>}
        </div>

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

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>제품 설명 *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="제품 설명을 입력해주세요. (최대 500자)"
            maxLength={500}
            rows={5}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${errors.description ? '#ef4444' : '#ccc'}`, boxSizing: 'border-box', resize: 'vertical' }}
          />
          {errors.description && <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.description}</p>}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>소비자가 *</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              name="price"
              value={formData.price}
              onChange={handlePriceChange}
              placeholder="0"
              style={{ flex: 1, padding: '10px', borderRadius: '4px', border: `1px solid ${errors.price ? '#ef4444' : '#ccc'}`, boxSizing: 'border-box' }}
            />
            <span>원</span>
          </div>
          {errors.price && <p style={{ color: '#ef4444', fontSize: '12px', margin: '5px 0 0 0' }}>{errors.price}</p>}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => navigate('/brand/products')}
            style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ flex: 2, padding: '12px', background: isSubmitting ? '#9ca3af' : '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s ease' }}
          >
            {isSubmitting ? '등록 중...' : '제품 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
