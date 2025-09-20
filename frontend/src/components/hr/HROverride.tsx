import React, { useState } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  User,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../api/LeaveServices';
import type { LeaveRequest } from '../../types';

interface HROverrideProps {
  request: LeaveRequest;
  onClose: () => void;
  onOverride: (requestId: string, action: 'approved' | 'rejected', comment: string) => void;
}

const HROverride: React.FC<HROverrideProps> = ({ request, onClose, onOverride }) => {
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<'approved' | 'rejected' | null>(null);
  const [hrComment, setHrComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasHRPermission = user?.role === 'hr' || user?.role === 'admin';

  const handleOverrideSubmit = async () => {
    if (!selectedAction || !hrComment.trim()) {
      setError('Please select an action and provide a comment');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      await leaveService.updateStatus(request._id, selectedAction, hrComment);
      onOverride(request._id, selectedAction, hrComment);
    } catch (error) {
      console.error('Error submitting override:', error);
      setError('Failed to override leave request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasHRPermission) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-2 text-sm text-gray-500">
              Only HR and Admin users can override manager decisions.
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

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle }
    };
    
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      personal: 'Personal Leave',
      maternity: 'Maternity Leave',
      paternity: 'Paternity Leave',
      unpaid: 'Unpaid Leave'
    };
    return types[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-6 border max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-purple-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">HR Override Decision</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  You are about to override a manager's decision
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  This action will be logged in the audit trail and cannot be undone.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Leave Request Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Employee:</span>
              <span className="font-medium text-gray-900">{request.employeeName}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Type:</span>
              <span className="font-medium text-gray-900">{getTypeDisplay(request.type)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Dates:</span>
              <span className="font-medium text-gray-900">
                {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Days:</span>
              <span className="font-medium text-gray-900">{request.dayCount} days</span>
            </div>
            
            <div className="md:col-span-2 flex items-center space-x-2">
              <span className="text-gray-600">Current Status:</span>
              {getStatusBadge(request.status)}
            </div>
          </div>
          
          <div className="mt-4">
            <div className="text-sm">
              <span className="text-gray-600">Reason:</span>
              <p className="text-gray-900 mt-1 bg-white p-3 rounded border">
                {request.reason}
              </p>
            </div>
          </div>

          {request.managerComments && (
            <div className="mt-4">
              <div className="text-sm">
                <span className="text-gray-600">Manager Comments:</span>
                <p className="text-gray-900 mt-1 bg-green-50 border border-green-200 p-3 rounded">
                  {request.managerComments}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Override Action</h4>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedAction('approved')}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedAction === 'approved'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <CheckCircle className={`h-5 w-5 mr-3 ${
                  selectedAction === 'approved' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <div>
                  <div className="font-medium text-gray-900">Approve Request</div>
                  <div className="text-sm text-gray-500">Override rejection and approve</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedAction('rejected')}
              className={`p-4 border rounded-lg text-left transition-colors ${
                selectedAction === 'rejected'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <XCircle className={`h-5 w-5 mr-3 ${
                  selectedAction === 'rejected' ? 'text-red-600' : 'text-gray-400'
                }`} />
                <div>
                  <div className="font-medium text-gray-900">Reject Request</div>
                  <div className="text-sm text-gray-500">Override approval and reject</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            HR Override Comments <span className="text-red-500">*</span>
          </label>
          <textarea
            value={hrComment}
            onChange={(e) => setHrComment(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder={
              selectedAction === 'approved' 
                ? "Explain why you are overriding the manager's rejection..."
                : selectedAction === 'rejected'
                ? "Explain why you are overriding the manager's approval..."
                : "Provide detailed comments for this override decision..."
            }
          />
          <p className="mt-1 text-xs text-gray-500">
            This comment will be visible to the employee and manager, and recorded in the audit trail.
          </p>
        </div>

        {selectedAction && (
          <div className={`mb-6 p-4 rounded-lg border ${
            selectedAction === 'approved' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              <AlertTriangle className={`h-5 w-5 mt-0.5 mr-2 ${
                selectedAction === 'approved' ? 'text-green-600' : 'text-red-600'
              }`} />
              <div className="text-sm">
                <p className={`font-medium ${
                  selectedAction === 'approved' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {selectedAction === 'approved' 
                    ? 'This will approve the leave request and deduct leave balance'
                    : 'This will reject the leave request and notify the employee'
                  }
                </p>
                <p className={`mt-1 ${
                  selectedAction === 'approved' ? 'text-green-700' : 'text-red-700'
                }`}>
                  The employee and manager will be notified of this HR override decision.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            Cancel
          </button>
          
          <button
            onClick={handleOverrideSubmit}
            disabled={!selectedAction || !hrComment.trim() || isSubmitting}
            className={`px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedAction === 'approved'
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : selectedAction === 'rejected'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing Override...
              </div>
            ) : (
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                {selectedAction === 'approved' ? 'Override & Approve' : 
                 selectedAction === 'rejected' ? 'Override & Reject' : 'Submit Override'}
              </div>
            )}
          </button>
        </div>

        {/* Audit Trail Info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-500">
            <MessageSquare className="h-3 w-3 mr-1" />
            This override will be recorded in the audit trail with timestamp and your user ID
          </div>
        </div>
      </div>
    </div>
  );
};

export default HROverride;