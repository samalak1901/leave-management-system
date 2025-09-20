import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Edit,
  Trash2,
  Filter,
  MessageSquare,
  Eye,
  User,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { leaveService } from '../../api/LeaveServices';
import type { LeaveRequest } from '../../types';
import EditLeaveModal from './EditLeaveModal';
import HROverride from '../hr/HROverride';
import CommentModal from './CommentModal';

interface LeaveRequestsProps {
  viewType: 'my-requests' | 'team-requests' | 'all-requests';
}

const LeaveRequests: React.FC<LeaveRequestsProps> = ({ viewType }) => {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [showViewCommentsModal, setShowViewCommentsModal] = useState<LeaveRequest | null>(null);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [hrOverrideRequest, setHrOverrideRequest] = useState<LeaveRequest | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedType !== 'all') params.type = selectedType;

      const data = await leaveService.list(params);

      const mappedData = data.map((item: any) => ({
        id: item._id,
        employeeId: item.userId._id,
        employeeName: item.userId.name,
        employeeDesignation: item.userId.designation || '',
        employeeDepartment: item.userId.department || '',
        startDate: item.startDate,
        endDate: item.endDate,
        type: item.type,
        reason: item.reason,
        status: item.status,
        appliedDate: item.createdAt,
        managerComments: item.comments && !item.hrOverride ? item.comments : '',
        hrComments: item.hrOverride ? item.comments : '',
        dayCount: Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 3600 * 24)) + 1
      }));

      setLeaveRequests(mappedData);
    } catch (err: any) {
      console.error('Failed to fetch leave requests:', err);
      setError('Failed to load leave requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [selectedStatus, selectedType]);

  const filteredRequests = useMemo(() => {
    let requests = leaveRequests;

    switch (viewType) {
      case 'my-requests':
        requests = requests.filter(req => req.employeeId === user?._id);
        break;
      case 'team-requests':
        requests = requests.filter(req => req.employeeId !== user?._id);
        break;
      case 'all-requests':
        break;
    }

    return requests;
  }, [leaveRequests, viewType, user?._id]);

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
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

  const canApproveReject = (request: LeaveRequest) => {
    return (
      request.status === 'pending' && 
      (user?.role === 'manager') &&
      request.employeeId !== user?._id
    );
  };

  const canEdit = (request: LeaveRequest) => {
    return (
      request.status === 'pending' && 
      request.employeeId === user?._id &&
      viewType === 'my-requests'
    );
  };

  const canCancel = (request: LeaveRequest) => {
    return (
      (request.status === 'pending' || request.status === 'approved') && 
      request.employeeId === user?._id &&
      viewType === 'my-requests'
    );
  };

  const canHROverride = (request: LeaveRequest) => {
    return (
      (user?.role === 'hr' || user?.role === 'admin') &&
      (request.status === 'approved' || request.status === 'rejected') &&
      request.employeeId !== user?._id
    );
  };

  const handleApproval = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      await leaveService.updateStatus(requestId, action, comment);
      setShowCommentModal(null);
      setComment('');
      fetchLeaves();
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update leave status. Please try again.');
    }
  };

  const handleViewDetails = (request: LeaveRequest) => {
    if (canEdit(request)) {
      setEditingRequest(request);
    } else {
      console.log('View details (read-only):', request);
    }
  };

  const handleViewComments = (request: LeaveRequest) => {
    setShowViewCommentsModal(request);
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await leaveService.cancel(requestId);
      setShowCancelConfirmModal(null);
      fetchLeaves();
    } catch (err) {
      console.error('Failed to cancel leave request:', err);
      setError('Failed to cancel leave request. Please try again.');
    }
  };

  const handleHROverride = (request: LeaveRequest) => {
    setHrOverrideRequest(request);
  };

  const handleOverrideSubmit = async (requestId: string, action: 'approved' | 'rejected', hrComment: string) => {
    try {
      await leaveService.updateStatus(requestId, action, hrComment);
      setHrOverrideRequest(null);
      fetchLeaves();
    } catch (err) {
      console.error('HR Override failed:', err);
      setError('Failed to override leave request. Please try again.');
    }
  };

  const getPageTitle = () => {
    switch (viewType) {
      case 'my-requests': return 'My Leave Requests';
      case 'team-requests': return 'Team Leave Requests';
      case 'all-requests': return 'All Leave Requests';
      default: return 'Leave Requests';
    }
  };

  const getPageDescription = () => {
    switch (viewType) {
      case 'my-requests': return 'View and manage your leave requests';
      case 'team-requests': return 'Review and approve your team members\' leave requests';
      case 'all-requests': return 'Monitor and manage all leave requests across the organization';
      default: return '';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h2>
          <p className="text-gray-600 mt-2">{getPageDescription()}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="maternity">Maternity Leave</option>
                <option value="paternity">Paternity Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div className="ml-auto text-sm text-gray-500">
              {loading ? 'Loading...' : `Showing ${filteredRequests.length} request${filteredRequests.length !== 1 ? 's' : ''}`}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No leave requests</h3>
              <p className="mt-2 text-sm text-gray-500">
                {viewType === 'my-requests' 
                  ? "You haven't submitted any leave requests yet."
                  : "No leave requests match the selected filters."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {(viewType === 'team-requests' || viewType === 'all-requests') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Leave Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      {(viewType === 'team-requests' || viewType === 'all-requests') && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.employeeName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.employeeDesignation}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getTypeDisplay(request.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(request.startDate).toLocaleDateString()} - 
                          {new Date(request.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{request.dayCount}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.appliedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {canEdit(request) && (
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Leave Request"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          {canCancel(request) && (
                            <button
                              onClick={() => setShowCancelConfirmModal(request.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel Request"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {canApproveReject(request) && (
                            <>
                              <button
                                onClick={() => setShowCommentModal(`${request.id}-approved`)}
                                className="text-green-600 hover:text-green-900"
                                title="Approve Request"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setShowCommentModal(`${request.id}-rejectd`)}
                                className="text-red-600 hover:text-red-900"
                                title="Reject Request"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {canHROverride(request) && (
                            <button
                              onClick={() => handleHROverride(request)}
                              className="text-purple-600 hover:text-purple-900"
                              title="HR Override"
                            >
                              <Shield className="h-4 w-4" />
                            </button>
                          )}
                          {(request.managerComments || request.hrComments) && (
                            <button
                              onClick={() => handleViewComments(request)}
                              className="text-gray-600 hover:text-gray-900"
                              title="View Comments"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Approval/Rejection Comment Modal */}
        {showCommentModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {showCommentModal.includes('approved') ? 'Approve Request' : 'Reject Request'}
                  </h3>
                  <button
                    onClick={() => setShowCommentModal(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment {showCommentModal.includes('rejected') ? '(Required)' : '(Optional)'}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={
                      showCommentModal.includes('approved') 
                        ? "Add any approval comments..." 
                        : "Please provide a reason for rejection..."
                    }
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCommentModal(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const requestId = showCommentModal.split('-')[0];
                      const action = showCommentModal.includes('approved') ? 'approved' : 'rejected';
                      if (action === 'rejected' && !comment.trim()) {
                        setError('Please provide a reason for rejection');
                        return;
                      }
                      handleApproval(requestId, action);
                    }}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      showCommentModal.includes('approved')
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                        : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    }`}
                  >
                    {showCommentModal.includes('approved') ? 'Approve' : 'Rejected'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Comments Modal */}
        {showViewCommentsModal && (
          <CommentModal
            request={showViewCommentsModal}
            onClose={() => setShowViewCommentsModal(null)}
          />
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirmModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Confirm Cancellation</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Are you sure you want to cancel this leave request? This action cannot be undone.
                </p>
                <div className="mt-6 flex justify-center space-x-3">
                  <button
                    onClick={() => setShowCancelConfirmModal(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleCancelRequest(showCancelConfirmModal)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Leave Modal */}
        {editingRequest && (
          <EditLeaveModal
            request={editingRequest}
            onClose={() => setEditingRequest(null)}
            onSuccess={fetchLeaves}
          />
        )}

        {/* HR Override Modal */}
        {hrOverrideRequest && (
          <HROverride
            request={hrOverrideRequest}
            onClose={() => setHrOverrideRequest(null)}
            onOverride={handleOverrideSubmit}
          />
        )}

        {/* Request Details Expandable Rows */}
        <div className="mt-6 space-y-4">
          {filteredRequests.map((request) => (
            request.reason && (
              <div key={`${request.id}-details`} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {getTypeDisplay(request.type)} - {request.employeeName}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Reason:</strong> {request.reason}
                    </p>
                    {request.managerComments && (
                      <p className="text-sm text-green-600 mt-2">
                        <strong>Manager Comments:</strong> {request.managerComments}
                      </p>
                    )}
                    {request.hrComments && (
                      <p className="text-sm text-purple-600 mt-2">
                        <strong>HR Comments:</strong> {request.hrComments}
                      </p>
                    )}
                  </div>
                  <div className="ml-4">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Summary Stats */}
        {filteredRequests.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">
                {filteredRequests.length}
              </div>
              <div className="text-sm text-gray-500">Total Requests</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredRequests.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredRequests.filter(r => r.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-500">Approved</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredRequests.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-sm text-gray-500">Rejected</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveRequests;