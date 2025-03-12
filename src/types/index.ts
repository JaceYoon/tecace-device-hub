
export type UserRole = 'manager' | 'user';

export interface User {
  id: string;
  name: string;
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
  isAuthenticated: boolean;
  isLoading: boolean;
  isManager: boolean;
  login: () => Promise<void>;
  logout: () => void;
}
