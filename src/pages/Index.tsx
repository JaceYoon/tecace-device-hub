
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginPage from '@/components/auth/LoginPage';

const Index: React.FC = () => {
  const navigate = useNavigate();
  
  // Use try/catch but in a useEffect to properly handle the hook
  React.useEffect(() => {
    try {
      const { isAuthenticated } = useAuth();
      if (isAuthenticated) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.log('Auth context not ready yet');
      // The AuthProvider isn't ready yet, so we'll just render the login page
    }
  }, [navigate]);
  
  return <LoginPage />;
};

export default Index;
