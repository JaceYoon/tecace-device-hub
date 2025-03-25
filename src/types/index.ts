
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
export type DeviceTypeCategory = 'Smartphone' | 'Tablet' | 'Smartwatch' | 'Box' | 'Accessory' | 'Other';

export interface Device {
  id: string;
  project: string;
  projectGroup: string;
  type: string;
  deviceType?: DeviceTypeCategory;
  imei?: string;
  serialNumber?: string;
  status: DeviceStatus;
  deviceStatus?: string;
  receivedDate?: Date;
  returnDate?: Date;
  assignedTo?: string; // User ID
  assignedToId?: string; // Added to support backend ID format
  assignedToName?: string; // Added to display user name directly
  addedBy: string; // User ID
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  requestedBy?: string; // User ID
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface DeviceRequest {
  id: string;
  deviceId: string;
  userId: string;
  status: RequestStatus;
  type: 'assign' | 'release';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string; // User ID
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
