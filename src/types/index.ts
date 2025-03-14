
export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type DeviceStatus = 'available' | 'assigned' | 'missing' | 'stolen';

export interface Device {
  id: string;
  name: string;
  type: string;
  imei: string;
  serialNumber: string;
  status: DeviceStatus;
  assignedTo?: string; // Changed from User to string (user ID)
  addedBy: string; // Changed from User to string (user ID)
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  requestedBy?: string; // Added requestedBy field as string (user ID)
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface DeviceRequest {
  id: string;
  deviceId: string;
  userId: string;
  status: RequestStatus;
  type: 'assign' | 'release';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string; // Changed from User to string (user ID)
  device?: Device;
  user?: User;
}

export interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isManager: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (firstName: string, lastName: string, email: string, password: string) 
    => Promise<{ success: boolean, message: string, verificationRequired: boolean }>;
  verifyEmail: (email: string, code: string, userData: { firstName: string, lastName: string, password: string }) 
    => Promise<boolean>;
  updateUserRole: (userId: string, role: 'admin' | 'user' | 'manager') => boolean;
}
