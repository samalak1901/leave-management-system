import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  User as UserIcon, 
  Mail, 
  Eye,
  Search,
  Shield,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types/index';
import EmployeeDetails from './EmployeeDetails';
import { userService } from '../../api/UserService';

const EmployeeList: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = user?.role === 'hr';

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: User[] = await userService.getEmployees();
        setEmployees(data);
      } catch (err) {
        console.error('Error fetching employees', err);
        setError('Failed to fetch employee data');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleEmployeeUpdate = (updatedEmployee: User) => {
    setEmployees(prev =>
      prev.map(emp => (emp._id === updatedEmployee._id ? updatedEmployee : emp))
    );
    setSelectedEmployee(updatedEmployee);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = selectedRole === 'all' || employee.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [searchTerm, selectedRole, employees]);

  const roles = useMemo(() => {
    return [...new Set(employees.map(emp => emp.role))];
  }, [employees]);

  const getRoleDisplay = (role: string) => {
    const displays: Record<string, string> = {
      employee: 'Employee',
      manager: 'Manager',
      hr: 'HR Manager'
    };
    return displays[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      employee: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      hr: 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getTotalLeaveBalance = (leaveBalances: User['leaveBalances']) => {
    return leaveBalances.annual + leaveBalances.sick;
  };

  const handleViewEmployee = (employee: User) => {
    setSelectedEmployee(employee);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedEmployee(null);
  };


  if (!hasPermission) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center">
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to view the employee list. This feature is only available to HR users.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading employees...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Employee Directory</h2>
            <p className="text-gray-600 mt-2">
              Manage employee profiles and leave information
            </p>
          </div>
         
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search employees..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{getRoleDisplay(role)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredEmployees.length}
            </div>
            <div className="text-sm text-gray-500">Total Employees</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredEmployees.filter(emp => emp.role === 'manager').length}
            </div>
            <div className="text-sm text-gray-500">Managers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {Math.round(
                filteredEmployees.reduce((sum, emp) => sum + getTotalLeaveBalance(emp.leaveBalances), 0) /
                (filteredEmployees.length || 1)
              )}
            </div>
            <div className="text-sm text-gray-500">Avg Leave Balance</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No employees found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Balance
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                            <UserIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {employee.name}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center mt-1">
                              <Mail className="h-3 w-3 mr-1" />
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {getRoleDisplay(employee.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex space-x-4">
                            <div className="text-center">
                              <div className="text-blue-600 font-medium">{employee.leaveBalances.annual}</div>
                              <div className="text-xs text-gray-500">Annual</div>
                            </div>
                            <div className="text-center">
                              <div className="text-red-600 font-medium">{employee.leaveBalances.sick}</div>
                              <div className="text-xs text-gray-500">Sick</div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewEmployee(employee)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedEmployee && (
          <EmployeeDetails
            employee={selectedEmployee}
            isOpen={isDetailsOpen}
            onClose={handleCloseDetails}
            onUpdate={handleEmployeeUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeeList;