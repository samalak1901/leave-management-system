export interface User {
  _id?: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'hr' | 'admin';
  designation?: string; 
  managerId?: string | null;
  leaveBalances: {
    annual: number;
    sick: number;
    [key: string]: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface LeaveRequest {
  _id: string;
  userId: User | string; 
  startDate: string | Date;
  endDate: string | Date;
  type: 'annual' | 'sick' | 'unpaid';
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  comments?: string; 
  managerComments?: string; 
  hrComments?: string; 
  hrOverride?: boolean;
  emergencyContact?: string;
  workHandover?: string;
  auditTrail?: {
    action: string;
    by: string;
    at: string;
    meta?: any;
  }[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  appliedDate?: string | Date; 
  dayCount: number;
  employeeName?: string;
  employeeDesignation?: string; 
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}
