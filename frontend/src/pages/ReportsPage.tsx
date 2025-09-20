import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveService } from '../api/LeaveServices';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Shield, 
  FileText,
  PieChart,
  UserCheck,
} from 'lucide-react';

const ReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    role: ''
  });

  if (user?.role !== 'hr') {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center">
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            This feature is only available to HR and Admin users.
          </p>
        </div>
      </div>
    );
  }

  const handleExport = async (reportType: string) => {
    setLoading(reportType);
    try {
      let blob;
      const params: any = {};
      
      switch (reportType) {
        case 'leaveReport':
          params.from = dateRange.startDate;
          params.to = dateRange.endDate;
          if (filters.status) params.status = filters.status;
          if (filters.type) params.type = filters.type;
          if (filters.role) params.role = filters.role;
          blob = await leaveService.exportLeaveReport(params);
          break;
        case 'leaveBalances':
          blob = await leaveService.exportLeaveBalancesReport();
          break;
        case 'roleAnalysis':
          blob = await leaveService.exportRoleAnalysis();
          break;
        case 'monthlyTrends':
          params.year = reportYear;
          blob = await leaveService.exportMonthlyTrends(params);
          break;
        case 'employeeDirectory':
          blob = await leaveService.exportEmployeeDirectory();
          break;
        default:
          return;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="year-select" className="text-sm font-medium text-gray-700 mr-2">
                Year:
              </label>
              <select
                id="year-select"
                value={reportYear}
                onChange={(e) => setReportYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                {[2022, 2023, 2024, 2025].map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={filters.role}
                onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 w-full"
              >
                <option value="">All Roles</option>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="hr">HR</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Leave Report</h3>
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Detailed leave report with filters for date range, status, and role
            </p>
            <button 
              onClick={() => handleExport('leaveReport')}
              disabled={loading === 'leaveReport'}
              className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading === 'leaveReport' ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Leave Balances</h3>
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Current leave balances for all employees with role information
            </p>
            <button 
              onClick={() => handleExport('leaveBalances')}
              disabled={loading === 'leaveBalances'}
              className="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading === 'leaveBalances' ? 'Generating...' : 'Export CSV'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Role Analysis</h3>
              <PieChart className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Role-wise leave statistics and analysis across the organization
            </p>
            <button 
              onClick={() => handleExport('roleAnalysis')}
              disabled={loading === 'roleAnalysis'}
              className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading === 'roleAnalysis' ? 'Generating...' : 'Export CSV'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Monthly leave request trends for {reportYear} with role breakdown
            </p>
            <button 
              onClick={() => handleExport('monthlyTrends')}
              disabled={loading === 'monthlyTrends'}
              className="mt-4 w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {loading === 'monthlyTrends' ? 'Generating...' : 'Export CSV'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Employee Directory</h3>
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Complete employee directory with role and manager information
            </p>
            <button 
              onClick={() => handleExport('employeeDirectory')}
              disabled={loading === 'employeeDirectory'}
              className="mt-4 w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 disabled:opacity-50"
            >
              {loading === 'employeeDirectory' ? 'Generating...' : 'Export CSV'}
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              <UserCheck className="h-5 w-5 text-red-600" />
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Total Employees: 150</p>
              <p>• Pending Approvals: 12</p>
              <p>• Avg. Leave Utilization: 65%</p>
              <p>• Most Common Leave Type: Annual</p>
            </div>
            <button 
              onClick={() => handleExport('leaveReport')}
              className="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              View Detailed Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;