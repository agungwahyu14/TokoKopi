import axiosInstance from '../lib/axios';

export const getLoyaltyPoints = async () => {
  const response = await axiosInstance.get('/api/loyalty/points');
  return response.data;
};
