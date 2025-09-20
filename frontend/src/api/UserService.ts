import axiosClient from "./axiosClient";

export const userService = {
  getEmployeeCount: async () => {
    const res = await axiosClient.get('/users/count');
    return res.data.count;
  },
  getEmployees: async () => {
    const res = await axiosClient.get('/users');
    return res.data;
  },
  getEmployeeById: async (id: string) => {
    const res = await axiosClient.get(`/users/${id}`);
    return res.data;
  },
  updateEmployee: async (id: string, payload: any) => {
    const res = await axiosClient.put(`/users/${id}`, payload);
    return res.data;
  },
  createEmployee: async (data: any) => {
    const res = await axiosClient.post('/users', data);
    return res.data;
  },
  getManagers: async () => {
    const res = await axiosClient.get('/users/managers');
    return res.data;
  },
};
