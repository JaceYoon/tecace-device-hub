
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import LoginPage from '@/components/auth/LoginPage';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = React.useState(false);
  
  // Use try/catch but in a useEffect to properly handle the hook
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { isAuthenticated } = useAuth();
        if (isAuthenticated) {
          navigate('/dashboard');
        }
        setAuthChecked(true);
      } catch (error) {
        console.log('Auth context not ready yet');
        // The AuthProvider isn't ready yet, so we'll just render the login page
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  // While checking auth, render nothing to prevent flicker
  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }
  
  return <LoginPage />;
};

export default Index;
