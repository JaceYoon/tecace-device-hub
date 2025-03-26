
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginPage from '@/components/auth/LoginPage';

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Instead of directly using useAuth, we'll wrap the authentication check in a try/catch
  // and provide a fallback for when the context isn't ready yet
  let isAuthenticated = false;
  try {
    const { isAuthenticated: authStatus } = useAuth();
    isAuthenticated = authStatus;
    
    useEffect(() => {
      if (isAuthenticated) {
        navigate('/dashboard');
      }
    }, [isAuthenticated, navigate]);
  } catch (error) {
    console.log('Auth context not ready yet');
    // The AuthProvider isn't ready yet, so we'll just render the login page
  }
  
  return <LoginPage />;
};

export default Index;
