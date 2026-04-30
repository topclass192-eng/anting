import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Code Splitting with React.lazy
const Login = React.lazy(() => import('./pages/Login'));
const RoleSelect = React.lazy(() => import('./pages/RoleSelect'));
const BrandDashboard = React.lazy(() => import('./pages/brand/Dashboard'));
const BrandProfile = React.lazy(() => import('./pages/brand/Profile'));
const ProductList = React.lazy(() => import('./pages/brand/ProductList'));
const ProductRegister = React.lazy(() => import('./pages/brand/ProductRegister'));
const CampaignRegister = React.lazy(() => import('./pages/brand/CampaignRegister'));
const ApplicantList = React.lazy(() => import('./pages/brand/ApplicantList'));
const ShippingInput = React.lazy(() => import('./pages/brand/ShippingInput'));
const ContentReview = React.lazy(() => import('./pages/brand/ContentReview'));
const InfluencerDashboard = React.lazy(() => import('./pages/influencer/Dashboard'));
const CampaignList = React.lazy(() => import('./pages/influencer/CampaignList'));
const CampaignDetail = React.lazy(() => import('./pages/influencer/CampaignDetail'));
const CampaignProgress = React.lazy(() => import('./pages/influencer/CampaignProgress'));
const ContentSubmit = React.lazy(() => import('./pages/influencer/ContentSubmit'));
const Points = React.lazy(() => import('./pages/influencer/Points'));
const MyPage = React.lazy(() => import('./pages/influencer/MyPage'));
const InfluencerProfile = React.lazy(() => import('./pages/influencer/Profile'));
const ShopHome = React.lazy(() => import('./pages/Shop'));

function Splash() {
  return (
    <div style={{ textAlign: 'center', marginTop: 50 }}>
      <h1>앤팅 스플래시 화면</h1>
      <a href="/login" style={{ display: 'inline-block', marginTop: 20 }}>로그인 이동</a>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          
          {/* Role Selection requires Auth but NO matching role. */}
          <Route path="/role-select" element={
            <ProtectedRoute requireNoRole={true}>
               <RoleSelect />
            </ProtectedRoute>
          } />
          
          <Route path="/brand/dashboard" element={
            <ProtectedRoute allowedRoles={['brand']}>
              <BrandDashboard />
            </ProtectedRoute>
          } />

          <Route path="/brand/profile" element={
            <ProtectedRoute allowedRoles={['brand']}>
              <BrandProfile />
            </ProtectedRoute>
          } />

          <Route path="/brand/products" element={
            <ProtectedRoute allowedRoles={['brand']}>
              <ProductList />
            </ProtectedRoute>
          } />

          <Route path="/brand/products/new" element={
            <ProtectedRoute allowedRoles={['brand']}>
              <ProductRegister />
            </ProtectedRoute>
          } />
          
          <Route path="/brand/products/:id/edit" element={
            <ProtectedRoute allowedRoles={['brand']}>
              <ProductRegister />
            </ProtectedRoute>
          } />
          
          <Route path="/brand/campaigns/new" element={
            <ProtectedRoute allowedRoles={['brand']}>
              <CampaignRegister />
            </ProtectedRoute>
          } />

          <Route path="/brand/campaigns/:id/applicants" element={
            <ProtectedRoute allowedRoles={['brand']}>
              <ApplicantList />
            </ProtectedRoute>
          } />

          <Route path="/brand/campaigns/:id/shipping" element={
            <ProtectedRoute allowedRoles={['brand']}>
              <ShippingInput />
            </ProtectedRoute>
          } />
          
          <Route path="/brand/campaigns/:id/review" element={
            <ProtectedRoute allowedRoles={['brand']}>
              <ContentReview />
            </ProtectedRoute>
          } />

          <Route path="/influencer/dashboard" element={
            <ProtectedRoute allowedRoles={['influencer']}>
              <InfluencerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/influencer/campaigns" element={
            <ProtectedRoute allowedRoles={['influencer']}>
              <CampaignList />
            </ProtectedRoute>
          } />
          
          <Route path="/influencer/campaigns/:id" element={
            <ProtectedRoute allowedRoles={['influencer']}>
              <CampaignDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/influencer/campaigns/:id/progress" element={
            <ProtectedRoute allowedRoles={['influencer']}>
              <CampaignProgress />
            </ProtectedRoute>
          } />

          <Route path="/influencer/campaigns/:id/submit" element={
            <ProtectedRoute allowedRoles={['influencer']}>
              <ContentSubmit />
            </ProtectedRoute>
          } />
          
          <Route path="/influencer/points" element={
            <ProtectedRoute allowedRoles={['influencer']}>
              <Points />
            </ProtectedRoute>
          } />
          
          <Route path="/influencer/mypage" element={
            <ProtectedRoute allowedRoles={['influencer']}>
              <MyPage />
            </ProtectedRoute>
          } />

          <Route path="/influencer/profile" element={
            <ProtectedRoute allowedRoles={['influencer']}>
              <InfluencerProfile />
            </ProtectedRoute>
          } />
          
          <Route path="/campaigns/:id" element={
            <ProtectedRoute allowedRoles={['influencer', 'brand']}>
              <CampaignDetail />
            </ProtectedRoute>
          } />
          
          <Route path="/shop" element={
            <ProtectedRoute allowedRoles={['shopper']}>
              <ShopHome />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
