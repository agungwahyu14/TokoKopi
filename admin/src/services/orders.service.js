import axiosInstance from '../lib/axios';

export const getAllOrders = async (params) => {
  const response = await axiosInstance.get('/api/orders', { params });
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await axiosInstance.get(`/api/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await axiosInstance.put(`/api/orders/${id}/status`, { status });
  return response.data;
};

export const requestDelivery = async (orderId) => {
  try {
    const response = await axiosInstance.post(`/api/shipping/request-delivery/${orderId}`);
    return response.data;
  } catch (error) {
    // Surface the real backend message rather than a generic axios error
    const message = error.response?.data?.message || error.message || 'Gagal memanggil kurir';
    throw new Error(message);
  }
};
