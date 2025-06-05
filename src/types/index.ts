export type UserRole = 'admin' | 'TPM' | 'Software Engineer' | 'user';

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type DeviceStatus = 'available' | 'assigned' | 'missing' | 'stolen' | 'returned' | 'dead' | 'pending';
export type DeviceTypeCategory = 'C-Type' | 'Lunchbox';
export type DeviceTypeValue = 'Smartphone' | 'Tablet' | 'Smartwatch' | 'Box' | 'PC' | 'Accessory' | 'Other';

export interface Device {
  id: string;
  project: string;
  projectGroup?: string;
  type: DeviceTypeValue;
  deviceType?: DeviceTypeCategory;
  imei?: string;
  serialNumber?: string;
  status: 'available' | 'assigned' | 'missing' | 'stolen' | 'returned' | 'dead' | 'pending';
  deviceStatus?: string;
  receivedDate?: Date;
  returnDate?: Date;
  notes?: string;
  memo?: string; // Added memo field
  devicePicture?: string; // Base64 encoded device image
  addedBy?: string;
  addedById?: string;
  assignedTo?: string;
  assignedToId?: string;
  assignedToName?: string;
  requestedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  lastModified?: Date; // Adding this property to fix the TypeScript errors
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'returned';

export interface DeviceRequest {
  id: string;
  deviceId: string;
  userId: string;
  status: RequestStatus;
  type: 'assign' | 'release' | 'report' | 'return';
  reportType?: 'missing' | 'stolen' | 'dead';
  reason?: string;
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string; // User ID
  device?: Device;
  user?: User;
  deviceName?: string; // Added for improved resilience
  userName?: string; // Added for improved resilience
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
  updateUserRole: (userId: string, role: 'admin' | 'user' | 'TPM' | 'Software Engineer') => Promise<boolean>;
  updateUserProfile: (updates: Partial<User>) => Promise<boolean>;
}
