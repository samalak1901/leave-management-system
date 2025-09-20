export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'hr';
  managerId?: string | null;
  leaveBalances: {
    annual: number;
    sick: number;
    [key: string]: number | undefined;
  };
  createdAt?: string;
  updatedAt?: string;
}
export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: 'annual' | 'sick' | 'unpaid'; 
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'; 
  comments?: string; 
  hrOverride?: boolean;
  auditTrail?: {
    action: string;
    by: string;
    at: string;
    meta?: any;
  }[];
  createdAt?: string; 
  updatedAt?: string;
  dayCount: number;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}