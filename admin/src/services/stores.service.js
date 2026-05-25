import axiosInstance from '../lib/axios';

export const getAllStores = async () => {
  const response = await axiosInstance.get('/api/stores');
  return response.data;
};

export const getNearbyStores = async (lat, lng) => {
  const response = await axiosInstance.get('/api/stores/nearby', { params: { lat, lng } });
  return response.data;
};

export const getStoreById = async (id) => {
  const response = await axiosInstance.get(`/api/stores/${id}`);
  return response.data;
};
