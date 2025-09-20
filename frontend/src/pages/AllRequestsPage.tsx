import React from 'react';
import LeaveRequests from '../components/leave/LeaveRequests';

const AllRequestsPage: React.FC = () => {
  return <LeaveRequests viewType="all-requests" />;
};

export default AllRequestsPage;