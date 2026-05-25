import axiosInstance from '../lib/axios';

export const getAllPromos = async (params) => {
  const response = await axiosInstance.get('/api/promos', { params });
  return response.data;
};

export const createPromo = async (data) => {
  const response = await axiosInstance.post('/api/promos', data);
  return response.data;
};

export const updatePromo = async ({ id, data }) => {
  const response = await axiosInstance.put(`/api/promos/${id}`, data);
  return response.data;
};

export const deletePromo = async (id) => {
  const response = await axiosInstance.delete(`/api/promos/${id}`);
  return response.data;
};

export const togglePromoStatus = async ({ id, isActive }) => {
  const response = await axiosInstance.patch(`/api/promos/${id}/status`, { isActive });
  return response.data;
};
