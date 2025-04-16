
import { User } from '@/types';
import { apiCall } from './utils';

// Create a function to get the data service lazily to avoid circular dependency
// Use dynamic import instead of require which isn't available in the browser
const getDataService = async () => {
  const dataServiceModule = await import('@/services/data.service');
  return dataServiceModule.dataService;
};

export const userService = {
  getAll: (): Promise<User[]> =>
    apiCall<User[]>('/users'),

  getCurrentUser: (): Promise<User | null> =>
    apiCall<User | null>('/users/me'),

  getById: (id: string): Promise<User | null> =>
    apiCall<User | null>(`/users/${id}`),

  updateRole: async (id: string, role: 'user' | 'admin' | 'TPM' | 'Software Engineer'): Promise<User | null> => {
    try {
      const result = await apiCall<User | null>(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      });
      
      // After successful role update, trigger a refresh in the data service
      if (result) {
        // Use the dynamic import to get the data service without circular dependency
        const dataService = await getDataService();
        dataService.triggerRefresh();
      }
      
      return result;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },
};
