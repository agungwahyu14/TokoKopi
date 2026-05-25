import axiosInstance from '../lib/axios';

export const getDashboardStats = async () => {
  const response = await axiosInstance.get('/api/admin/dashboard');
  return response.data;
};
