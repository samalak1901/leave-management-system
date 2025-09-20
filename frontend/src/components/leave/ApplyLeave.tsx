import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axiosClient from '../../api/axiosClient';

const ApplyLeave: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'annual' as 'annual' | 'sick' | 'unpaid',
    reason: '',
    emergencyContact: '',
    workHandover: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [leaveBalances, setLeaveBalances] = useState({
    annual: 0,
    sick: 0,
    unpaid: 0,
  });

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave', icon: Calendar, color: 'text-blue-600' },
    { value: 'sick', label: 'Sick Leave', icon: Clock, color: 'text-red-600' },
    { value: 'unpaid', label: 'Unpaid Leave', icon: FileText, color: 'text-green-600' },
  ];

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await axiosClient.get('/leaves/balance');
        setLeaveBalances(res.data.leaveBalances);
      } catch (err) {
        console.error('Failed to fetch balances:', err);
      }
    };
    fetchBalances();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start < today) newErrors.startDate = 'Start date cannot be in the past';
      if (end < start) newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason is required';
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getAvailableBalance = () => leaveBalances[formData.type] || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const requestedDays = calculateDays();
    const availableBalance = getAvailableBalance();

    if (formData.type !== 'unpaid' && requestedDays > availableBalance) {
      setErrors({
        ...errors,
        general: `Insufficient ${formData.type} leave balance. You have ${availableBalance} days, requested ${requestedDays}.`
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await axiosClient.post('/leaves', {
        startDate: formData.startDate,
        endDate: formData.endDate,
        type: formData.type,
        reason: formData.reason,
      });

      setSubmitSuccess(true);
      setFormData({
        startDate: '',
        endDate: '',
        type: 'annual',
        reason: '',
        emergencyContact: '',
        workHandover: ''
      });
      setErrors({});

      const res = await axiosClient.get('/leaves/balance');
      setLeaveBalances(res.data.leaveBalances);

    } catch (err: any) {
      setErrors({
        general: err.response?.data?.message || 'Failed to submit leave request.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
    if (errors.general) setErrors({ ...errors, general: '' });
    if (submitSuccess) setSubmitSuccess(false);
  };

  const requestedDays = calculateDays();
  const availableBalance = getAvailableBalance();

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Apply for Leave</h2>
          <p className="text-gray-600 mt-2">Submit your leave request for manager approval</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Annual</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{leaveBalances.annual}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Sick</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{leaveBalances.sick}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Unpaid</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{leaveBalances.unpaid}</span>
                </div>
              </div>
            </div>

            {(formData.startDate || formData.endDate) && (
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Requested Days:</span>
                    <span className="text-sm font-medium text-gray-900">{requestedDays}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Available Balance:</span>
                    <span className="text-sm font-medium text-gray-900">{availableBalance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Remaining After:</span>
                    <span className={`text-sm font-medium ${
                      availableBalance - requestedDays >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {availableBalance - requestedDays}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="text-sm font-medium text-green-800">
                      Leave Request Submitted Successfully!
                    </h3>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Your leave request has been sent to your manager for approval.
                  </p>
                </div>
              )}

              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">{errors.general}</span>
                  </div>
                </div>
              )}

               <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Leave Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyLeave;