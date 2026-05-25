import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { asyncStorage } from './storage';

interface OrderState {
  orderType: 'pickup' | 'delivery';
  selectedStore: any | null;
  deliveryAddress: string | null;
  deliveryCoords: { latitude: number; longitude: number } | null;
  selectedPromo: any | null;
  paymentMethod: string;
  deliveryCourier: any | null;
  setOrderType: (type: 'pickup' | 'delivery') => void;
  setSelectedStore: (store: any) => void;
  setDeliveryAddress: (address: string, coords?: { latitude: number; longitude: number }) => void;
  setSelectedPromo: (promo: any | null) => void;
  setPaymentMethod: (method: string) => void;
  setDeliveryCourier: (courier: any | null) => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      orderType: 'pickup',
      selectedStore: null,
      deliveryAddress: null,
      deliveryCoords: null,
      selectedPromo: null,
      paymentMethod: 'cash',
      deliveryCourier: null,
      setOrderType: (type) => set({ orderType: type }),
      setSelectedStore: (store) => set({ selectedStore: store }),
      setDeliveryAddress: (address, coords) => set({ deliveryAddress: address, deliveryCoords: coords || null }),
      setSelectedPromo: (promo) => set({ selectedPromo: promo }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setDeliveryCourier: (courier) => set({ deliveryCourier: courier }),
    }),
    {
      name: 'order-storage',
      storage: createJSONStorage(() => asyncStorage),
    }
  )
);
