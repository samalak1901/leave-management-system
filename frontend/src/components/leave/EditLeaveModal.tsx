import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Save,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../api/LeaveServices';
import type { LeaveRequest } from '../../types';

interface EditLeaveModalProps {
  request: LeaveRequest;
  onClose: () => void;
  onSuccess: () => void;
}

const EditLeaveModal: React.FC<EditLeaveModalProps> = ({ request, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'annual' as 'annual' | 'sick'  | 'unpaid',
    reason: '',
    emergencyContact: '',
    workHandover: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave', icon: Calendar, color: 'text-blue-600' },
    { value: 'sick', label: 'Sick Leave', icon: Clock, color: 'text-red-600' },
    { value: 'unpaid', label: 'Unpaid Leave', icon: FileText, color: 'text-gray-600' }
  ];

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const leaves = await leaveService.list({ _id: request.id });
        if (leaves.length === 0) {
          setError('Leave request not found');
          setLoading(false);
          return;
        }
        const item = leaves[0];
        setFormData({
          startDate: item.startDate.split('T')[0],
          endDate: item.endDate.split('T')[0],
          type: item.type,
          reason: item.reason,
          emergencyContact: item.emergencyContact || '',
          workHandover: item.workHandover || ''
        });
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch leave request:', err);
        setError('Failed to load leave request. Please try again.');
        setLoading(false);
      }
    };
    fetchRequest();
  }, [request.id]);

  const canEdit = () => {
    return request.status === 'pending' && request.employeeId === user?._id;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }

      if (end < start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    if (formData.type === 'sick' && !formData.emergencyContact.trim()) {
      newErrors.emergencyContact = 'Emergency contact is required for sick leave';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  };

  const getAvailableBalance = async () => {
    try {
      const balances = await leaveService.getBalance();
      return balances[formData.type] || 0;
    } catch (err) {
      console.error('Failed to fetch leave balance:', err);
      return 0;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const requestedDays = calculateDays();
    const availableBalance = await getAvailableBalance();

    if (formData.type !== 'unpaid' && requestedDays > availableBalance) {
      setError(`Insufficient leave balance. You have ${availableBalance} days available, but requested ${requestedDays} days.`);
      return;
    }

    setSaving(true);
    setError('');
    
    try {
      await leaveService.edit(request.id, {
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        emergencyContact: formData.emergencyContact,
        workHandover: formData.workHandover
      });
      
      setSuccess(true);
      onSuccess();
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Failed to update leave request:', error);
      setError(error.response?.data?.message || 'Failed to update leave request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leave request...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canEdit()) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Cannot Edit Request</h3>
            <p className="mt-2 text-sm text-gray-500">
              Only pending leave requests can be edited.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const requestedDays = calculateDays();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Edit Leave Request</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {success && (
            <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="text-sm font-medium text-green-800">
                  Leave Request Updated Successfully!
                </h3>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Your changes have been saved. Closing...
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">{error}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Leave Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {leaveTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <label
                    key={type.value}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      formData.type === type.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="sr-only"
                    />
                    <Icon className={`h-5 w-5 mr-3 ${type.color}`} />
                    <span className="text-sm font-medium text-gray-900">
                      {type.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.endDate ? 'border-red-300' : 'border-gray-300'
                }`}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              rows={4}
              placeholder="Please provide a detailed reason for your leave request..."
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.reason ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">
              {formData.reason.length}/500 characters
            </p>
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
            )}
          </div>

          {formData.type === 'sick' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Name and phone number of emergency contact"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  errors.emergencyContact ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.emergencyContact && (
                <p className="mt-1 text-sm text-red-600">{errors.emergencyContact}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Handover Details
            </label>
            <textarea
              value={formData.workHandover}
              onChange={(e) => handleInputChange('workHandover', e.target.value)}
              rows={3}
              placeholder="Describe how your work will be handled during your absence (optional)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {(formData.startDate || formData.endDate) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Request Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Requested Days:</span>
                  <span className="font-medium text-gray-900">{requestedDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Leave Type:</span>
                  <span className="font-medium text-gray-900">{getTypeDisplay(formData.type)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const getTypeDisplay = (type: string) => {
  const types: Record<string, string> = {
    annual: 'Annual Leave',
    sick: 'Sick Leave',
    unpaid: 'Unpaid Leave'
  };
  return types[type] || type;
};

export default EditLeaveModal;