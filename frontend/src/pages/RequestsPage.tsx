import React from 'react';
import LeaveRequests from '../components/leave/LeaveRequests';

export const MyRequestsPage: React.FC = () => {
  return <LeaveRequests viewType="my-requests" />;
};

export const TeamRequestsPage: React.FC = () => {
  return <LeaveRequests viewType="team-requests" />;
};

export const AllRequestsPage: React.FC = () => {
  return <LeaveRequests viewType="all-requests" />;
};