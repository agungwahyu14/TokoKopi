import axiosInstance from '../lib/axios';

export const updateProfile = async (profileData) => {
  try {
    const response = await axiosInstance.put('/auth/profile', profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getMe = async () => {
  try {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
