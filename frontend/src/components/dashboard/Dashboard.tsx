import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Users, FileText, TrendingUp, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../api/LeaveServices';
import { userService } from '../../api/UserService';

interface DashboardStats {
  pendingRequests: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  totalUsedDays: number;
  teamRequests?: number;
  teamMembers?: number;
  totalEmployees?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>({});
  const [stats, setStats] = useState<DashboardStats>({
    pendingRequests: 0,
    approvedThisMonth: 0,
    rejectedThisMonth: 0,
    totalUsedDays: 0
  });
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const statsData = await leaveService.getStats();
      setStats(statsData);
      
      const params: any = { sort: '-createdAt', limit: 5 };
      const leaves = await leaveService.list(params);
      setLeaveRequests(leaves);
      
      if (user?.role === 'employee') {
        const balance = await leaveService.getBalance();
        setLeaveBalance(balance);
      }
      
      if (user?.role === 'manager') {
        const members = await leaveService.getTeamMembers();
        setTeamMembers(members);
      }
      
      if ((user?.role === 'hr' || user?.role === 'admin') && !statsData.totalEmployees) {
        const count = await userService.getEmployeeCount();
        setStats(prev => ({ ...prev, totalEmployees: count }));
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLeaveBalanceCards = () => {
    if (!user || !leaveBalance) return [];
    
    const cards = [
      {
        type: 'Annual Leave',
        total: 25, 
        balance: leaveBalance.annual || 0,
        color: 'bg-blue-100 text-blue-800',
        icon: Calendar
      },
      {
        type: 'Sick Leave',
        total: 15, 
        balance: leaveBalance.sick || 0,
        color: 'bg-red-100 text-red-800',
        icon: Clock
      }
    ];
    
    if (leaveBalance.personal !== undefined) {
      cards.push({
        type: 'Personal Leave',
        total: 10,
        balance: leaveBalance.personal,
        color: 'bg-green-100 text-green-800',
        icon: FileText
      });
    }
    
    return cards;
  };

  const getStatsCards = () => {
    switch (user?.role) {
      case 'employee':
        return [
          {
            title: 'Pending Requests',
            value: stats.pendingRequests,
            icon: Clock,
            color: 'text-yellow-600 bg-yellow-100'
          },
          {
            title: 'Approved This Month',
            value: stats.approvedThisMonth,
            icon: CheckCircle,
            color: 'text-green-600 bg-green-100'
          },
          {
            title: 'Total Days Used',
            value: stats.totalUsedDays,
            icon: Calendar,
            color: 'text-blue-600 bg-blue-100'
          }
        ];

      case 'manager':
        return [
          {
            title: 'Team Requests',
            value: stats.teamRequests || 0,
            icon: FileText,
            color: 'text-blue-600 bg-blue-100'
          },
          {
            title: 'Pending Approvals',
            value: stats.pendingRequests,
            icon: Clock,
            color: 'text-yellow-600 bg-yellow-100'
          },
          {
            title: 'Team Members',
            value: teamMembers.length || 0,
            icon: Users,
            color: 'text-purple-600 bg-purple-100'
          }
        ];

      case 'hr':
      case 'admin':
        return [
          {
            title: 'Total Employees',
            value: stats.totalEmployees || 0,
            icon: Users,
            color: 'text-blue-600 bg-blue-100'
          },
          {
            title: 'Pending Requests',
            value: stats.pendingRequests,
            icon: Clock,
            color: 'text-yellow-600 bg-yellow-100'
          },
          {
            title: 'Approved This Month',
            value: stats.approvedThisMonth,
            icon: CheckCircle,
            color: 'text-green-600 bg-green-100'
          },
          {
            title: 'Rejected This Month',
            value: stats.rejectedThisMonth,
            icon: XCircle,
            color: 'text-red-600 bg-red-100'
          }
        ];

      default:
        return [];
    }
  };

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'employee':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {leaveRequests.map(leave => (
                <div key={leave._id} className={`flex items-center space-x-3 p-3 ${
                  leave.status === 'pending' ? 'bg-yellow-50' : 
                  leave.status === 'approved' ? 'bg-green-50' : 
                  leave.status === 'rejected' ? 'bg-red-50' : 'bg-gray-50'
                } rounded-lg`}>
                  {leave.status === 'pending' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                  {leave.status === 'approved' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  {leave.status === 'rejected' && <XCircle className="h-5 w-5 text-red-600" />}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {leave.type} Request {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      {leave.status === 'pending' && ' • Awaiting approval'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'manager':
        const pendingLeaves = leaveRequests.filter(leave => leave.status === 'pending');
        
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Leave Requests</h3>
            <div className="space-y-3">
              {pendingLeaves.slice(0, 5).map(leave => (
                <div key={leave._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {leave.userId?.name || 'Unknown'} - {leave.type}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                        {' • '}
                        {Math.ceil(
                          (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / 
                          (1000 * 60 * 60 * 24)
                        ) + 1} days
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700"
                      onClick={() => handleUpdateStatus(leave._id, 'approved')}
                    >
                      Approve
                    </button>
                    <button 
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                      onClick={() => handleUpdateStatus(leave._id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'hr':
      case 'admin':
        const approvedLeaves = leaveRequests.filter(leave => leave.status === 'approved');
        const rejectedLeaves = leaveRequests.filter(leave => leave.status === 'rejected');
        
        const utilizationRate = approvedLeaves.length > 0 
          ? Math.round((approvedLeaves.length / leaveRequests.length) * 100) 
          : 0;
        
        const approvalRate = (approvedLeaves.length + rejectedLeaves.length) > 0
          ? Math.round((approvedLeaves.length / (approvedLeaves.length + rejectedLeaves.length)) * 100)
          : 0;
        
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Leave Utilization</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-2">{utilizationRate}%</p>
                <p className="text-xs text-blue-700">Average across all employees</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Approval Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-2">{approvalRate}%</p>
                <p className="text-xs text-green-700">Last 30 days</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleUpdateStatus = async (leaveId: string, status: 'approved' | 'rejected') => {
    try {
      await leaveService.updateStatus(leaveId, status);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

  const leaveBalanceCards = getLeaveBalanceCards();
  const statsCards = getStatsCards();

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h2>
        <p className="text-indigo-100">
          {user?.role === 'employee' && "Here's your leave dashboard overview."}
          {user?.role === 'manager' && "Manage your team's leave requests and view your dashboard."}
          {(user?.role === 'hr' || user?.role === 'admin') && "Monitor and manage all leave requests across the organization."}
        </p>
      </div>

      {user?.role === 'employee' && leaveBalanceCards.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaveBalanceCards.map((leave, index) => {
              const Icon = leave.icon;
              const percentage = (leave.balance / leave.total) * 100;
              
              return (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{leave.type}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">
                        {leave.balance}
                        <span className="text-lg text-gray-500">/{leave.total}</span>
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${leave.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${100 - percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {leave.total - leave.balance} days used
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
        <div className={`grid grid-cols-1 gap-6 ${
          statsCards.length === 3 ? 'md:grid-cols-3' : 
          statsCards.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 
          'md:grid-cols-2'
        }`}>
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.color} mr-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {getRoleSpecificContent()}
    </div>
  );
};

export default Dashboard;