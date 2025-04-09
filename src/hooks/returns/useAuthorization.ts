
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

export const useAuthorization = () => {
  const { isAdmin, isManager, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only admins can access pages with this hook
    if (!isAdmin) {
      navigate('/dashboard');
      toast.error('Only administrators can access this page');
    }
  }, [isAdmin, navigate]);

  return {
    isAdmin,
    isManager,
    user
  };
};
