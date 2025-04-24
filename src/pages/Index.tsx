
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginPage from '@/components/auth/LoginPage';
import { Loader2 } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // Use useEffect to check authentication status after component mounts
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Wait for auth state to be fully loaded
        if (isLoading) {
          return;
        }
        
        console.log('Auth check complete. isAuthenticated:', isAuthenticated);
        console.log('User info:', user);
        
        // If in production, check for recent login attempt
        const isProduction = process.env.NODE_ENV === 'production';
        const recentLogin = localStorage.getItem('auth-login-time');
        const currentTime = Date.now();
        const loginTime = recentLogin ? parseInt(recentLogin) : 0;
        const justLoggedIn = recentLogin && (currentTime - loginTime < 5000);
        
        if (isAuthenticated && user) {
          console.log('User authenticated, redirecting to dashboard');
          navigate('/dashboard');
        } else if (isProduction && justLoggedIn) {
          // If we just logged in but session not yet detected, wait a moment
          console.log('Recent login detected, checking authentication status again...');
          setTimeout(() => setCheckingAuth(false), 1500);
          return;
        }
        
        setAuthChecked(true);
        setCheckingAuth(false);
      } catch (error) {
        console.error('Auth context error:', error);
        setAuthChecked(true);
        setCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [navigate, isAuthenticated, user, isLoading]);
  
  // While checking auth, render loading indicator
  if (isLoading || checkingAuth) {
    return <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <div className="text-lg font-medium">Authenticating...</div>
    </div>;
  }
  
  return <LoginPage />;
};

export default Index;
