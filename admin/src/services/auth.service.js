import axiosInstance from '../lib/axios';

export const loginUser = async (email, password) => {
  const response = await axiosInstance.post('/api/auth/login', { email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await axiosInstance.get('/api/auth/me');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await axiosInstance.put('/api/auth/profile', data);
  return response.data;
};
