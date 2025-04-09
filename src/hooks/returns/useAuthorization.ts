
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

export const useAuthorization = () => {
  const { isAdmin, isManager, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin && !isManager) {
      navigate('/dashboard');
      toast.error('Only administrators or managers can access this page');
    }
  }, [isAdmin, isManager, navigate]);

  return {
    isAdmin,
    isManager,
    user
  };
};
