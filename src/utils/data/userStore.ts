
import { User } from '@/types';
import { mockUsers } from './mockData';

class UserStore {
  private users: User[] = [...mockUsers];

  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }
  
  // Additional user methods can be added here as needed
}

export const userStore = new UserStore();
