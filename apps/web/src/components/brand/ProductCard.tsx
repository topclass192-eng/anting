import React from 'react';

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  images: string[];
  status: 'active' | 'deleted';
  createdAt: string | number; // usually timestamp but converted to string/number
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(price);
  };

  const formattedDate = new Date(product.createdAt).toLocaleDateString('ko-KR');

  return (
    <div style={{
      border: '1px solid #eee',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{ position: 'relative', width: '100%', paddingTop: '100%' }}>
        <img 
          src={product.images[0] || 'https://via.placeholder.com/300?text=No+Image'} 
          alt={product.name}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', top: '10px', left: '10px', 
          background: 'rgba(0,0,0,0.6)', color: 'white', 
          padding: '4px 8px', borderRadius: '4px', fontSize: '12px'
        }}>
          {product.category}
        </div>
      </div>
      
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
          {product.name}
        </h3>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {product.description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#111' }}>
            {formatPrice(product.price)}
          </span>
          <span style={{ fontSize: '12px', color: '#999' }}>
            등록일: {formattedDate}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => onEdit(product)}
            style={{ flex: 1, padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', color: '#374151' }}
          >
            수정
          </button>
          <button 
            onClick={() => onDelete(product)}
            style={{ flex: 1, padding: '8px', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', color: '#b91c1c' }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
