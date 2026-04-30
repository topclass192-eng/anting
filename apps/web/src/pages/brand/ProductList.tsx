import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import ProductCard, { Product } from '../../components/brand/ProductCard';

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastVisibleId, setLastVisibleId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchProducts = async (isLoadMore = false) => {
    try {
      const functions = getFunctions();
      const getProducts = httpsCallable(functions, 'getProducts');
      
      const response = await getProducts({ 
        limit: 10, 
        startAfter: isLoadMore ? lastVisibleId : null 
      });
      
      const data = response.data as { products: Product[], lastVisibleId: string | null };
      
      if (isLoadMore) {
        setProducts(prev => [...prev, ...data.products]);
      } else {
        setProducts(data.products);
      }
      
      setLastVisibleId(data.lastVisibleId);
      setHasMore(!!data.lastVisibleId && data.products.length === 10);
      
    } catch (err: any) {
      console.error('Fetch products failed:', err);
      setError('제품 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: Product) => {
    navigate(`/brand/products/${product.id}/edit`);
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`'${product.name}' 제품을 정말 삭제하시겠습니까?`)) return;

    try {
      const functions = getFunctions();
      const deleteProduct = httpsCallable(functions, 'deleteProduct');
      
      const res = await deleteProduct({ productId: product.id });
      if ((res.data as any).success) {
        setProducts(prev => prev.filter(p => p.id !== product.id));
      }
    } catch (err: any) {
      console.error('Delete product failed:', err);
      alert('제품 삭제에 실패했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>등록된 제품 목록</h1>
        <button 
          onClick={() => navigate('/brand/products/new')}
          style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + 새 제품 등록
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading && products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>로딩 중...</div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f9fafb', borderRadius: '8px', color: '#6b7280' }}>
          <p style={{ margin: '0 0 16px 0', fontSize: '18px' }}>등록된 제품이 없습니다.</p>
          <button 
            onClick={() => navigate('/brand/products/new')}
            style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            첫 제품 등록하기
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
              />
            ))}
          </div>
          
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
              <button 
                onClick={() => fetchProducts(true)}
                style={{ padding: '10px 30px', background: 'white', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                더 보기
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
