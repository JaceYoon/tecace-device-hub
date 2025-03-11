
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
  assignedTo?: string; // user id
  requestedBy?: string; // user id
  addedBy: string; // manager id
  addedAt: Date;
  updatedAt: Date;
  notes?: string;
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
  processedBy?: string; // manager id
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isManager: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
