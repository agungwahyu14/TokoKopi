import axiosInstance from '../lib/axios';

export const getAllProducts = async (params) => {
  const response = await axiosInstance.get('/api/products', { params });
  return response.data;
};

export const getProductById = async (id) => {
  const response = await axiosInstance.get(`/api/products/${id}`);
  return response.data;
};

export const createProduct = async (data) => {
  const response = await axiosInstance.post('/api/products', data);
  return response.data;
};

export const updateProduct = async (id, data) => {
  const response = await axiosInstance.put(`/api/products/${id}`, data);
  return response.data;
};

export const updateStock = async (id, data) => {
  const response = await axiosInstance.patch(`/api/products/${id}/availability`, data);
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await axiosInstance.delete(`/api/products/${id}`);
  return response.data;
};
