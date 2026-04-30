import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // if empty, anyone authenticated is allowed
  requireNoRole?: boolean; // if true, only users WITHOUT a role can access (e.g. RoleSelect)
}

export default function ProtectedRoute({ children, allowedRoles = [], requireNoRole = false }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        // Force token refresh to ensure we have the latest claims (in case role was just set)
        const idTokenResult = await user.getIdTokenResult(true);
        const role = idTokenResult.claims.role as string | null;
        setUserRole(role || null);
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>인증 정보 확인 중...</div>;
  }

  // Not authenticated -> redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but no role yet
  if (!userRole) {
    // If we are on RoleSelect page, allow them.
    if (requireNoRole) {
      return <>{children}</>;
    }
    // Else, redirect them to role-select
    return <Navigate to="/role-select" replace />;
  }

  // Authenticated with a role, but trying to access a page requiring no role (e.g., RoleSelect)
  if (userRole && requireNoRole) {
    // Redirect to their dashboard
    if (userRole === 'brand') return <Navigate to="/brand/dashboard" replace />;
    if (userRole === 'influencer') return <Navigate to="/influencer/dashboard" replace />;
    if (userRole === 'shopper') return <Navigate to="/shop" replace />;
    return <Navigate to="/" replace />;
  }

  // Check strict role requirements
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Wrong role -> redirect them to their respective dashboard
    if (userRole === 'brand') return <Navigate to="/brand/dashboard" replace />;
    if (userRole === 'influencer') return <Navigate to="/influencer/dashboard" replace />;
    if (userRole === 'shopper') return <Navigate to="/shop" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
