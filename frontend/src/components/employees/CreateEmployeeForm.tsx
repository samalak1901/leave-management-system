import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  UserCheck, 
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Calendar
} from 'lucide-react';
import { userService } from '../../api/UserService';
import { useAuth } from '../../context/AuthContext';
import type { User as UserType } from '../../types/index';

interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
}

const CreateEmployeeForm: React.FC = () => {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as UserType['role'],
    managerId: '',
    leaveBalances: { annual: 25, sick: 15 },
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form | keyof typeof form.leaveBalances, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (form.role === 'employee') {
      fetchManagers();
    }
  }, [form.role]);

  const fetchManagers = async () => {
    setLoadingManagers(true);
    try {
      const response = await userService.getManagers();
      const fetchedManagers: Manager[] = response.map((manager: any) => ({
        id: manager._id.toString(),
        name: manager.name,
        email: manager.email,
        role: manager.role,
      }));
      setManagers(fetchedManagers);
    } catch (err: any) {
      console.error('Error fetching managers:', err);
      setError('Failed to load managers. Please try again.');
    } finally {
      setLoadingManagers(false);
    }
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof typeof form | keyof typeof form.leaveBalances, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Valid email required';
    if (!form.password) newErrors.password = 'Password is required';
    if (form.leaveBalances.annual < 0 || form.leaveBalances.annual > 50) newErrors.annual = 'Annual leave must be 0-50';
    if (form.leaveBalances.sick < 0 || form.leaveBalances.sick > 30) newErrors.sick = 'Sick leave must be 0-30';
    if (form.role === 'employee' && !form.managerId) newErrors.managerId = 'Manager is required for employees';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    
    if (name === 'role' && value !== 'employee') {
      setForm(prev => ({ ...prev, managerId: '' }));
    }
    
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const handleLeaveBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      leaveBalances: { ...prev.leaveBalances, [name]: parseInt(value) || 0 },
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response = await userService.createEmployee({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        managerId: form.managerId || null,
        leaveBalances: {
          annual: form.leaveBalances.annual,
          sick: form.leaveBalances.sick,
        },
      });
      
      console.log('Created employee:', response);
      setSuccess(true);
      setForm({ 
        name: '', 
        email: '', 
        password: '', 
        role: 'employee', 
        managerId: '', 
        leaveBalances: { annual: 25, sick: 15 } 
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedManager = () => {
    return managers.find(manager => manager.id === form.managerId);
  };

  if (user?.role !== 'hr' && user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto text-center bg-white rounded-lg shadow p-6">
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            Only HR and Admin users can create employee accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <User className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-2xl font-bold text-gray-900">Create New Employee</h2>
          </div>
          <p className="text-gray-600">Add a new employee to the system with initial leave balances</p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm font-medium text-green-800">
                Employee created successfully!
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          </div>
        )}

        {Object.values(errors).some((err) => err) && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 mb-1">Please fix the following errors:</p>
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {Object.values(errors).filter(err => err).map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock className="inline h-4 w-4 mr-1" />
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleInputChange}
                      placeholder="Enter password"
                      className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Work Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Shield className="inline h-4 w-4 mr-1" />
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR Manager</option>
                  </select>
                </div>

                {form.role === 'employee' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserCheck className="inline h-4 w-4 mr-1" />
                      Reporting Manager <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="managerId"
                      value={form.managerId}
                      onChange={handleInputChange}
                      disabled={loadingManagers}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                        errors.managerId ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">
                        {loadingManagers ? 'Loading managers...' : 'Select Manager'}
                      </option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name}
                        </option>
                      ))}
                    </select>
                    {errors.managerId && <p className="mt-1 text-sm text-red-600">{errors.managerId}</p>}
                    
                    {form.managerId && getSelectedManager() && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Selected Manager:</strong> {getSelectedManager()?.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          {getSelectedManager()?.email}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Initial Leave Balances
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Leave (Days)
                  </label>
                  <input
                    type="number"
                    name="annual"
                    value={form.leaveBalances.annual}
                    onChange={handleLeaveBalanceChange}
                    min="0"
                    max="50"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.annual ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.annual && <p className="mt-1 text-sm text-red-600">{errors.annual}</p>}
                  <p className="mt-1 text-xs text-gray-500">Maximum: 50 days</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sick Leave (Days)
                  </label>
                  <input
                    type="number"
                    name="sick"
                    value={form.leaveBalances.sick}
                    onChange={handleLeaveBalanceChange}
                    min="0"
                    max="30"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.sick ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.sick && <p className="mt-1 text-sm text-red-600">{errors.sick}</p>}
                  <p className="mt-1 text-xs text-gray-500">Maximum: 30 days</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Employee...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Create Employee
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEmployeeForm;