import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ClipboardList, ShoppingBag, BarChart2, User, Sparkles } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isInfluencer = location.pathname.startsWith('/influencer');

  const brandNavItems = [
    { label: '홈', path: '/brand/dashboard', icon: <Home size={24} /> },
    { label: '캠페인', path: '/brand/campaigns', icon: <ClipboardList size={24} /> },
    { label: '쇼핑', path: '/brand/shop', icon: <ShoppingBag size={24} /> },
    { label: '리포트', path: '/brand/reports', icon: <BarChart2 size={24} /> },
    { label: '마이', path: '/brand/profile', icon: <User size={24} /> },
  ];

  const influencerNavItems = [
    { label: '홈', path: '/influencer/dashboard', icon: <Home size={24} /> },
    { label: '캠페인', path: '/influencer/campaigns', icon: <ClipboardList size={24} /> },
    { label: 'AI콘텐츠', path: '/influencer/ai-content', icon: <Sparkles size={24} /> },
    { label: '쇼핑', path: '/shop', icon: <ShoppingBag size={24} /> },
    { label: '마이', path: '/influencer/profile', icon: <User size={24} /> },
  ];

  const navItems = isInfluencer ? influencerNavItems : brandNavItems;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      backgroundColor: 'white',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '10px 0',
      paddingBottom: 'calc(10px + env(safe-area-inset-bottom))', // Safe area padding
      zIndex: 50,
      boxShadow: '0 -4px 15px rgba(0,0,0,0.03)'
    }}>
      {navItems.map((item) => {
        // AI 콘텐츠는 임시로 클릭 이벤트를 무시하거나 경로 이동을 막을 수 있지만, 우선은 이동하게 둡니다.
        const isActive = location.pathname.startsWith(item.path);
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              color: isActive ? '#111827' : '#9ca3af',
              minWidth: '60px',
              transition: 'color 0.2s ease-in-out'
            }}
          >
            <div style={{ marginBottom: '4px' }}>{item.icon}</div>
            <span style={{ fontSize: '10px', fontWeight: isActive ? '700' : '500' }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
