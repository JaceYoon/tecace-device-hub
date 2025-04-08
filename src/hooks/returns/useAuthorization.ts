
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

export const useAuthorization = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      toast.error('Only administrators can access this page');
    }
  }, [isAdmin, navigate]);

  return {
    isAdmin,
    user
  };
};
