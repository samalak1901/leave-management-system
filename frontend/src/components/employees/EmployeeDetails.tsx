import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Briefcase, Shield, X } from 'lucide-react';
import { userService } from '../../api/UserService';
import type { User } from '../../types/index';

interface EmployeeDetailsProps {
  employee: User;
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeDetails: React.FC<EmployeeDetailsProps> = ({ employee, isOpen, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<User>({
    _id: employee._id || '',
    name: employee.name || '',
    email: employee.email || '',
    role: employee.role || 'employee',
    leaveBalances: employee.leaveBalances || { annual: 0, sick: 0 },
    managerId: employee.managerId || null,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof User['leaveBalances'] | keyof User, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !isEditing) {
      setFormData({
        _id: employee._id || '',
        name: employee.name || '',
        email: employee.email || '',
        role: employee.role || 'employee',
        leaveBalances: employee.leaveBalances || { annual: 0, sick: 0 },
        managerId: employee.managerId || null,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      });
    }
  }, [employee, isOpen, isEditing]);

  useEffect(() => {
    if (isOpen && !isEditing && employee._id) {
      const fetchEmployee = async () => {
        try {
          const updatedEmployee = await userService.getEmployeeById(employee._id);
          console.log('Fetched employee:', updatedEmployee);
          if (!updatedEmployee._id) {
            setError('Invalid employee data: missing ID');
            return;
          }
          setFormData({
            ...updatedEmployee,
            leaveBalances: updatedEmployee.leaveBalances || { annual: 0, sick: 0 },
          });
        } catch (err) {
          console.error('Error fetching employee:', err);
          setError('Failed to fetch employee data');
        }
      };
      fetchEmployee();
    }
  }, [isOpen, employee._id, isEditing]);

  const getRoleDisplay = (role: string) => {
    const displays: Record<string, string> = {
      employee: 'Employee',
      manager: 'Manager',
      hr: 'HR Manager',
    };
    return displays[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      employee: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      hr: 'bg-purple-100 text-purple-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getTotalLeaveBalance = (leaveBalances: User['leaveBalances'] | undefined) => {
    if (!leaveBalances) return 0;
    return leaveBalances.annual + leaveBalances.sick;
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof User['leaveBalances'] | keyof User, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.leaveBalances.annual < 0 || formData.leaveBalances.annual > 50) {
      newErrors.annual = 'Annual leave must be between 0 and 50';
    }

    if (formData.leaveBalances.sick < 0 || formData.leaveBalances.sick > 30) {
      newErrors.sick = 'Sick leave must be between 0 and 30';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleLeaveBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      leaveBalances: {
        ...prev.leaveBalances,
        [name]: parseInt(value) || 0,
      },
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('Submitting formData:', formData); 
      const submitData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        managerId: formData.managerId,
        leaveBalances: {
          annual: formData.leaveBalances.annual,
          sick: formData.leaveBalances.sick,
        },
      };
      const response = await userService.updateEmployee(formData._id, submitData);
      const updatedEmployee = response.user || response; 
      if (!updatedEmployee.leaveBalances) {
        setError('Failed to retrieve updated leave balances');
        setLoading(false);
        return;
      }
      setFormData({
        ...updatedEmployee,
        leaveBalances: updatedEmployee.leaveBalances || { annual: 0, sick: 0 },
      });
      setIsEditing(false);
    } catch (err: any) {
      console.error('Error updating employee:', err);
      setError(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setError(null);
    setFormData({
      _id: employee._id || '',
      name: employee.name || '',
      email: employee.email || '',
      role: employee.role || 'employee',
      leaveBalances: employee.leaveBalances || { annual: 0, sick: 0 },
      managerId: employee.managerId || null,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    });
  };

  const handleClose = () => {
    setIsEditing(false);
    setErrors({});
    setError(null);
    setFormData({
      _id: employee._id || '',
      name: employee.name || '',
      email: employee.email || '',
      role: employee.role || 'employee',
      leaveBalances: employee.leaveBalances || { annual: 0, sick: 0 },
      managerId: employee.managerId || null,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Employee Details</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {Object.values(errors).some((err) => err) && (
            <div className="text-red-600 text-sm">
              {Object.values(errors).filter((err) => err).join(', ')}
            </div>
          )}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-900">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR Manager</option>
                </select>
              </div>
              {formData.managerId !== undefined && (
                <div>
                  <label className="text-sm font-medium text-gray-900">Manager ID</label>
                  <input
                    type="text"
                    name="managerId"
                    value={formData.managerId || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Leave Balances</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-600">Annual</label>
                    <input
                      type="number"
                      name="annual"
                      value={formData.leaveBalances.annual}
                      onChange={handleLeaveBalanceChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.annual ? 'border-red-300' : 'border-gray-300'
                      }`}
                      min="0"
                      max="50"
                    />
                    {errors.annual && <p className="text-sm text-red-600">{errors.annual}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Sick</label>
                    <input
                      type="number"
                      name="sick"
                      value={formData.leaveBalances.sick}
                      onChange={handleLeaveBalanceChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.sick ? 'border-red-300' : 'border-gray-300'
                      }`}
                      min="0"
                      max="30"
                    />
                    {errors.sick && <p className="text-sm text-red-600">{errors.sick}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="text-center">
                <div className="h-20 w-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="h-10 w-10 text-gray-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900">{formData.name}</h4>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getRoleBadgeColor(formData.role)}`}>
                  <Shield className="h-3 w-3 mr-1" />
                  {getRoleDisplay(formData.role)}
                </span>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Contact Information</h5>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {formData.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                    Employee ID: {formData._id ? `EMP-${formData._id.padStart(4, '0')}` : 'EMP-N/A'}
                  </div>
                  {formData.managerId && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                      Manager ID: {formData.managerId}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Leave Balance</h5>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Annual Leave</span>
                    <span className="text-sm font-medium text-blue-600">
                      {formData.leaveBalances ? `${formData.leaveBalances.annual} days` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sick Leave</span>
                    <span className="text-sm font-medium text-red-600">
                      {formData.leaveBalances ? `${formData.leaveBalances.sick} days` : 'N/A'}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-medium">
                      <span className="text-sm text-gray-900">Total Balance</span>
                      <span className="text-sm text-gray-900">
                        {formData.leaveBalances ? `${getTotalLeaveBalance(formData.leaveBalances)} days` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {(formData.createdAt || formData.updatedAt) && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Metadata</h5>
                  {formData.createdAt && (
                    <p className="text-sm text-gray-600">
                      Created: {new Date(formData.createdAt).toLocaleDateString()}
                    </p>
                  )}
                  {formData.updatedAt && (
                    <p className="text-sm text-gray-600">
                      Updated: {new Date(formData.updatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end p-6 border-t">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 mr-2"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;