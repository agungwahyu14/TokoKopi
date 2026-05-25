import axiosInstance from '../lib/axios';

export const getSalesReport = async (params) => {
  const response = await axiosInstance.get('/api/admin/reports/sales', { params });
  return response.data;
};

export const getTopProductsReport = async () => {
  const response = await axiosInstance.get('/api/admin/reports/products');
  return response.data;
};

export const getTopCustomersReport = async () => {
  const response = await axiosInstance.get('/api/admin/reports/customers');
  return response.data;
};
