import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';

// --- PRODUCT QUERIES ---

export const useMenu = () => {
  return useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      try {
        console.log('[API Request] GET /products?limit=100');
        const { data } = await api.get('/products?limit=100');
        console.log('[API Response] GET /products?limit=100:', data);
        return data.data;
      } catch (error: any) {
        console.log('[API Error] GET /products?limit=100:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useProductDetail = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      try {
        console.log(`[API Request] GET /products/${id}`);
        const { data } = await api.get(`/products/${id}`);
        console.log(`[API Response] GET /products/${id}:`, data);
        return data.data;
      } catch (error: any) {
        console.log(`[API Error] GET /products/${id}:`, error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!id,
  });
};

// --- PROMO QUERIES ---

export const usePromos = () => {
  return useQuery({
    queryKey: ['promos'],
    queryFn: async () => {
      try {
        console.log('[API Request] GET /promos');
        const { data } = await api.get('/promos');
        console.log('[API Response] GET /promos:', data);
        return data.data;
      } catch (error: any) {
        console.log('[API Error] GET /promos:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const usePromoDetail = (id: string) => {
  return useQuery({
    queryKey: ['promo', id],
    queryFn: async () => {
      try {
        console.log(`[API Request] GET /promos/${id}`);
        const { data } = await api.get(`/promos/${id}`);
        console.log(`[API Response] GET /promos/${id}:`, data);
        return data.data;
      } catch (error: any) {
        console.log(`[API Error] GET /promos/${id}:`, error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!id,
  });
};

export const useUserVouchers = () => {
  return useQuery({
    queryKey: ['user-vouchers'],
    queryFn: async () => {
      try {
        console.log('[API Request] GET /promos/my-vouchers');
        const { data } = await api.get('/promos/my-vouchers');
        console.log('[API Response] GET /promos/my-vouchers:', data);
        return data.data;
      } catch (error: any) {
        console.log('[API Error] GET /promos/my-vouchers:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useShippingRates = (payload: any) => {
  return useQuery({
    queryKey: ['shipping-rates', payload],
    queryFn: async () => {
      try {
        console.log('[API Request] POST /shipping/rates', payload);
        const { data } = await api.post('/shipping/rates', payload);
        console.log('[API Response] POST /shipping/rates:', data);
        return data.data;
      } catch (error: any) {
        console.log('[API Error] POST /shipping/rates:', error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!payload && !!payload.destinationLatitude && !!payload.storeId,
  });
};

export const useOrderTracking = (orderId: string) => {
  return useQuery({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      try {
        console.log(`[API Request] GET /shipping/tracking/${orderId}`);
        const { data } = await api.get(`/shipping/tracking/${orderId}`);
        console.log(`[API Response] GET /shipping/tracking/${orderId}:`, data);
        return data.data;
      } catch (error: any) {
        console.log(`[API Error] GET /shipping/tracking/${orderId}:`, error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!orderId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useClaimPromo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (promoId: number) => {
      try {
        console.log('[API Request] POST /promos/claim:', { promoId });
        const { data } = await api.post('/promos/claim', { promoId });
        console.log('[API Response] POST /promos/claim:', data);
        return data;
      } catch (error: any) {
        console.log('[API Error] POST /promos/claim:', error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
};

// --- CATEGORY QUERIES ---

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        console.log('[API Request] GET /categories');
        const { data } = await api.get('/categories');
        console.log('[API Response] GET /categories:', data);
        return data.data;
      } catch (error: any) {
        console.log('[API Error] GET /categories:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

// --- STORE QUERIES ---

export const useNearbyStores = (lat: number | null, lng: number | null, radius = 50) => {
  return useQuery({
    queryKey: ['stores', 'nearby', lat, lng, radius],
    queryFn: async () => {
      if (lat === null || lng === null) return [];
      try {
        console.log('[API Request] GET /stores/nearby:', { lat, lng, radius });
        const { data } = await api.get('/stores/nearby', {
          params: { lat, lng, radius },
        });
        console.log('[API Response] GET /stores/nearby:', data);
        return data.data;
      } catch (error: any) {
        console.log('[API Error] GET /stores/nearby:', error.response?.data || error.message);
        throw error;
      }
    },
    enabled: lat !== null && lng !== null,
  });
};

// --- AUTH MUTATIONS ---

export const useRequestOTP = () => {
  return useMutation({
    mutationFn: async (phone: string) => {
      try {
        console.log('[API Request] POST /auth/request-otp:', { phone });
        const { data } = await api.post('/auth/request-otp', { phone });
        console.log('[API Response] POST /auth/request-otp:', data);
        return data;
      } catch (error: any) {
        console.log('[API Error] POST /auth/request-otp:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useVerifyOTP = () => {
  return useMutation({
    mutationFn: async ({ phone, otp }: { phone: string; otp: string }) => {
      try {
        console.log('[API Request] POST /auth/verify-otp:', { phone, otp });
        const { data } = await api.post('/auth/verify-otp', { phone, otp });
        console.log('[API Response] POST /auth/verify-otp:', data);
        return data;
      } catch (error: any) {
        console.log('[API Error] POST /auth/verify-otp:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useVerifyPIN = () => {
  return useMutation({
    mutationFn: async ({ phone, pin }: { phone: string; pin: string }) => {
      try {
        console.log('[API Request] POST /auth/verify-pin:', { phone, pin: '******' });
        const { data } = await api.post('/auth/verify-pin', { phone, pin });
        console.log('[API Response] POST /auth/verify-pin:', data);
        return data;
      } catch (error: any) {
        console.log('[API Error] POST /auth/verify-pin:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useLogout = () => {
  return useMutation({
    mutationFn: async () => {
      try {
        console.log('[API Request] POST /auth/logout');
        const { data } = await api.post('/auth/logout');
        console.log('[API Response] POST /auth/logout:', data);
        return data;
      } catch (error: any) {
        console.log('[API Error] POST /auth/logout:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        console.log('[API Request] GET /auth/me');
        const { data } = await api.get('/auth/me');
        console.log('[API Response] GET /auth/me:', data);
        return data.data;
      } catch (error: any) {
        console.log('[API Error] GET /auth/me:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

// --- ORDER QUERIES ---

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      try {
        console.log('[API Request] GET /orders');
        const { data } = await api.get('/orders');
        console.log('[API Response] GET /orders:', data);
        return data.data;
      } catch (error: any) {
        console.log('[API Error] GET /orders:', error.response?.data || error.message);
        throw error;
      }
    },
    refetchInterval: (query) => {
      const orders = query.state.data as any[];
      if (!orders) return false;
      const hasActiveOrders = orders.some((order: any) => 
        !['completed', 'cancelled'].includes(order.status.toLowerCase())
      );
      return hasActiveOrders ? 20000 : false;
    },
    staleTime: 5000, // Data dianggap segar selama 5 detik
  });
};

// --- CART QUERIES & MUTATIONS ---

export const useCart = () => {
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      try {
        console.log('[API Request] GET /cart');
        const { data } = await api.get('/cart');
        console.log('[API Response] GET /cart:', data);
        return data.data;
      } catch (error: any) {
        console.log('[API Error] GET /cart:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useAddToCart = () => {
  return useMutation({
    mutationFn: async (payload: { productId: number; quantity: number; notes?: string; options?: any }) => {
      try {
        console.log('[API Request] POST /cart:', payload);
        const { data } = await api.post('/cart', payload);
        console.log('[API Response] POST /cart:', data);
        return data;
      } catch (error: any) {
        console.log('[API Error] POST /cart:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useUpdateCartItem = () => {
  return useMutation({
    mutationFn: async ({ id, quantity, notes }: { id: number; quantity?: number; notes?: string }) => {
      try {
        console.log(`[API Request] PUT /cart/${id}:`, { quantity, notes });
        const { data } = await api.put(`/cart/${id}`, { quantity, notes });
        console.log(`[API Response] PUT /cart/${id}:`, data);
        return data;
      } catch (error: any) {
        console.log(`[API Error] PUT /cart/${id}:`, error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useRemoveFromCart = () => {
  return useMutation({
    mutationFn: async (id: number) => {
      try {
        console.log(`[API Request] DELETE /cart/${id}`);
        const { data } = await api.delete(`/cart/${id}`);
        console.log(`[API Response] DELETE /cart/${id}:`, data);
        return data;
      } catch (error: any) {
        console.log(`[API Error] DELETE /cart/${id}:`, error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useClearCart = () => {
  return useMutation({
    mutationFn: async () => {
      try {
        console.log('[API Request] DELETE /cart');
        const { data } = await api.delete('/cart');
        console.log('[API Response] DELETE /cart:', data);
        return data;
      } catch (error: any) {
        console.log('[API Error] DELETE /cart:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useOrderDetail = (id: string) => {
  return useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      console.log(`[API Request] GET /orders/${id}`);
      const { data } = await api.get(`/orders/${id}`);
      console.log(`[API Response] GET /orders/${id}:`, data);
      return data.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const order = query.state.data as any;
      if (!order) return 10000;
      const s = order.status?.toLowerCase();
      if (['completed', 'cancelled'].includes(s)) return false;   // Stop polling
      if (s === 'on_delivery') return 15000;                      // Fast poll while driver is active
      return 30000;                                               // Slow poll for other active statuses
    },
    staleTime: 5000,
  });
};

export const useCheckout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { 
      storeId?: number; 
      notes?: string; 
      orderType?: string; 
      paymentMethod?: string;
      promoCode?: string | null;
      shippingCost?: number;
      deliveryAddress?: string | null;
      deliveryLatitude?: number | null;
      deliveryLongitude?: number | null;
      receiverName?: string;
      receiverPhone?: string;
      courierCode?: string;
      courierService?: string;
    }) => {
      try {
        console.log('[API Request] POST /orders/checkout:', payload);
        const { data } = await api.post('/orders/checkout', payload);
        console.log('[API Response] POST /orders/checkout:', data);
        return data;
      } catch (error: any) {
        console.log('[API Error] POST /orders/checkout:', error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useOrderById = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      try {
        console.log(`[API Request] GET /orders/${id}`);
        const { data } = await api.get(`/orders/${id}`);
        console.log(`[API Response] GET /orders/${id}:`, data);
        return data.data;
      } catch (error: any) {
        console.log(`[API Error] GET /orders/${id}:`, error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!id,
  });
};

export const useCreatePayment = () => {
  return useMutation({
    mutationFn: async (orderId: string) => {
      try {
        console.log('[API Request] POST /orders/:id/pay:', { orderId });
        const { data } = await api.post(`/orders/${orderId}/pay`);
        console.log('[API Response] POST /orders/:id/pay:', data);
        return data.data as {
          token: string;
          redirectUrl: string;
          orderNumber: string;
        };
      } catch (error: any) {
        console.log('[API Error] POST /orders/:id/pay:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useAddresses = () => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      try {
        console.log('[API Request] GET /users/addresses');
        const { data } = await api.get('/users/addresses');
        console.log('[API Response] GET /users/addresses:', data);
        return data.data;
      } catch (error: any) {
        console.log('[API Error] GET /users/addresses:', error.response?.data || error.message);
        throw error;
      }
    },
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { label: string; address: string; latitude: number; longitude: number; isDefault?: boolean }) => {
      try {
        console.log('[API Request] POST /users/addresses:', payload);
        const { data } = await api.post('/users/addresses', payload);
        console.log('[API Response] POST /users/addresses:', data);
        return data;
      } catch (error: any) {
        console.log('[API Error] POST /users/addresses:', error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

export const useTracking = (orderId: string) => {
  return useQuery({
    queryKey: ['tracking', orderId],
    queryFn: async () => {
      try {
        console.log(`[API Request] GET /shipping/tracking/${orderId}`);
        const { data } = await api.get(`/shipping/tracking/${orderId}`);
        console.log(`[API Response] GET /shipping/tracking/${orderId}:`, data);
        return data.data;
      } catch (error: any) {
        console.log(`[API Error] GET /shipping/tracking/${orderId}:`, error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!orderId,
    refetchInterval: 30000,
  });
};

export const useCreateRating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { orderId: number; stars: number; comment?: string }) => {
      try {
        console.log('[API Request] POST /ratings:', payload);
        const { data } = await api.post('/ratings', payload);
        console.log('[API Response] POST /ratings:', data);
        return data;
      } catch (error: any) {
        console.log('[API Error] POST /ratings:', error.response?.data || error.message);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId.toString()] });
    },
  });
};

// --- NOTIFICATION QUERIES ---

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/notifications?limit=50');
        return data.data as any[];
      } catch (error: any) {
        console.log('[API Error] GET /notifications:', error.response?.data || error.message);
        throw error;
      }
    },
    refetchInterval: 30000, // Kembalikan ke 30 detik untuk penghematan resource
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        return (data.data?.count ?? 0) as number;
      } catch (error: any) {
        console.log('[API Error] GET /notifications/unread-count:', error.response?.data || error.message);
        return 0;
      }
    },
    refetchInterval: 20000, // Poll every 20s for badge accuracy
  });
};

export const useNotificationDetail = (id: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['notification', id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/notifications/${id}`);
        // After fetching detail (auto-read), invalidate counts
        queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        return data.data;
      } catch (error: any) {
        console.log(`[API Error] GET /notifications/${id}:`, error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!id,
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/notifications/read-all');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });
};

