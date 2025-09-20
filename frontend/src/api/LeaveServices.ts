// src/services/leaveService.ts - Updated version

import axiosClient from './axiosClient';

export const leaveService = {
  list: async (params?: any) => {
    const res = await axiosClient.get('/leaves', { params });
    return res.data.leaves;
  },

  apply: async (data: any) => {
    const res = await axiosClient.post('/leaves', data);
    return res.data.leave;
  },

  updateStatus: async (leaveId: string, status: 'approved' | 'rejected', comments?: string) => {
    const res = await axiosClient.patch(`/leaves/update/${leaveId}`, { status, comments });
    return res.data.leave;
  },

  edit: async (leaveId: string, data: any) => {
    const res = await axiosClient.patch(`/leaves/edit/${leaveId}`, data);
    return res.data.leave;
  },

  cancel: async (leaveId: string) => {
    const res = await axiosClient.patch(`/leaves/cancel/${leaveId}`);
    return res.data.leave;
  },

  getBalance: async () => {
    const res = await axiosClient.get('/leaves/balance');
    return res.data.leaveBalances;
  },

  exportLeaveReport: async (params: any) => {
    const res = await axiosClient.get('/leaves/admin/export', {
      params,
      responseType: 'blob'
    });
    return res.data;
  },

  exportLeaveBalancesReport: async () => {
    const res = await axiosClient.get('/leaves/admin/export-balances', { responseType: 'blob' });
    return res.data;
  },

  exportRoleAnalysis: async () => {
    const res = await axiosClient.get('/leaves/admin/export-role-analysis', { responseType: 'blob' });
    return res.data;
  },

  exportMonthlyTrends: async (params: any) => {
    const res = await axiosClient.get('/leaves/admin/export-monthly-trends', {
      params,
      responseType: 'blob'
    });
    return res.data;
  },

  exportEmployeeDirectory: async () => {
    const res = await axiosClient.get('/leaves/admin/export-employee-directory', { responseType: 'blob' });
    return res.data;
  },

  // NEW: Get statistics for dashboard
  getStats: async () => {
    const res = await axiosClient.get('/leaves/stats');
    return res.data;
  },

  // NEW: Get team members for managers
  getTeamMembers: async () => {
    const res = await axiosClient.get('/leaves/team-members');
    return res.data.teamMembers;
  }
};