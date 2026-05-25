import axiosInstance from '../lib/axios';

/**
 * Ambil semua notifikasi (view admin)
 * GET /api/notifications/admin/all
 */
export const getAllNotificationsAdmin = async (params) => {
  const response = await axiosInstance.get('/api/notifications/admin/all', { params });
  return response.data;
};

/**
 * Kirim notifikasi ke user tertentu atau broadcast ke semua
 * POST /api/notifications/send  (multipart/form-data)
 */
export const sendNotification = async (formData) => {
  const response = await axiosInstance.post('/api/notifications/send', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Hapus satu notifikasi
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (id) => {
  const response = await axiosInstance.delete(`/api/notifications/${id}`);
  return response.data;
};
