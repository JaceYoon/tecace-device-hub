
import { User } from '@/types';
import { apiCall } from './utils';

// Import the dataService function using a function to avoid circular dependency
const getDataService = () => {
  return require('@/services/data.service').dataService;
};

export const userService = {
  getAll: (): Promise<User[]> =>
    apiCall<User[]>('/users'),

  getCurrentUser: (): Promise<User | null> =>
    apiCall<User | null>('/users/me'),

  getById: (id: string): Promise<User | null> =>
    apiCall<User | null>(`/users/${id}`),

  updateRole: async (id: string, role: 'user' | 'admin' | 'TPM' | 'Software Engineer'): Promise<User | null> => {
    const result = await apiCall<User | null>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
    
    // After successful role update, trigger a refresh in the data service
    if (result) {
      // Use the getter function to avoid circular dependency
      getDataService().triggerRefresh();
    }
    
    return result;
  },
};
