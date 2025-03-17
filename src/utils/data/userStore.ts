
import { User } from '@/types';
import { mockUsers } from './mockData';

class UserStore {
  private users: User[] = [];

  constructor() {
    // Try to load users from localStorage first
    try {
      const storedUsers = localStorage.getItem('tecace_users');
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        // Initialize with mock users if none exist
        this.users = [...mockUsers];
        localStorage.setItem('tecace_users', JSON.stringify(this.users));
      }
    } catch (error) {
      console.error('Error initializing UserStore:', error);
      this.users = [...mockUsers];
    }
  }

  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }
  
  addUser(user: User): User {
    // Add the user to the list
    this.users.push(user);
    
    // Update localStorage
    localStorage.setItem('tecace_users', JSON.stringify(this.users));
    
    return user;
  }
  
  updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return null;
    
    this.users[index] = {
      ...this.users[index],
      ...updates
    };
    
    // Update localStorage
    localStorage.setItem('tecace_users', JSON.stringify(this.users));
    
    return this.users[index];
  }
  
  // Add test users and preserve existing ones
  addTestUsers(newUsers: User[]): void {
    const existingEmails = new Set(this.users.map(u => u.email.toLowerCase()));
    
    // Only add users that don't exist yet
    const usersToAdd = newUsers.filter(u => !existingEmails.has(u.email.toLowerCase()));
    
    if (usersToAdd.length > 0) {
      this.users = [...this.users, ...usersToAdd];
      localStorage.setItem('tecace_users', JSON.stringify(this.users));
    }
  }
}

export const userStore = new UserStore();
