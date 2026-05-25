import axiosInstance from '../lib/axios';

export const getAllUsers = async (params) => {
  const response = await axiosInstance.get('/api/users', { params });
  return response.data;
};

export const getUserAddresses = async () => {
  const response = await axiosInstance.get('/api/users/addresses');
  return response.data;
};
export const updateUserPoints = async ({ id, points }) => {
  const response = await axiosInstance.patch(`/api/users/${id}/points`, { points });
  return response.data;
};
