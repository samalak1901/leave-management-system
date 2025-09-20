import React from 'react';
import { MessageSquare, XCircle } from 'lucide-react';
import type { LeaveRequest } from '../../types';

interface CommentModalProps {
  request: LeaveRequest;
  onClose: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({ request, onClose }) => {
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
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Comments</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {getTypeDisplay(request.type)} - {request.employeeName}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Reason:</strong> {request.reason}
              </p>
            </div>
            {request.managerComments && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Comments
                </label>
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                  {request.managerComments}
                </div>
              </div>
            )}
            {request.hrComments && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HR Comments
                </label>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-md text-sm text-purple-800">
                  {request.hrComments}
                </div>
              </div>
            )}
            {!request.managerComments && !request.hrComments && (
              <p className="text-sm text-gray-500 text-center">
                No comments available for this request.
              </p>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;