import axiosInstance from '../lib/axios';

export const getAllCategories = async () => {
  const response = await axiosInstance.get('/api/categories');
  return response.data;
};

export const createCategory = async (data) => {
  const response = await axiosInstance.post('/api/categories', data);
  return response.data;
};

export const updateCategory = async ({ id, data }) => {
  const response = await axiosInstance.put(`/api/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await axiosInstance.delete(`/api/categories/${id}`);
  return response.data;
};

export const reorderCategories = async (newOrder) => {
  const response = await axiosInstance.put('/api/categories/reorder', { newOrder });
  return response.data;
};
