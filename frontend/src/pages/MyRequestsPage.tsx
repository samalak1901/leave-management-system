import React from 'react';
import LeaveRequests from '../components/leave/LeaveRequests';

const MyRequestsPage: React.FC = () => {
  return <LeaveRequests viewType="my-requests" />;
};

export default MyRequestsPage;