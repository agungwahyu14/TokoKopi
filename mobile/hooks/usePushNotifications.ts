import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../services/api';
import { useAuthStore } from '../store/useStore';

// Konfigurasi behavior notifikasi saat app aktif (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,    
    shouldShowBanner: true,   // Aktifkan banner bawaan OS saat app terbuka
    shouldShowList: true,     
    shouldPlaySound: true,    // Aktifkan suara notifikasi
    shouldSetBadge: true,
  }),
});

/**
 * Konversi data push notification ke URL route yang sesuai
 */
export function getRouteFromNotificationData(data: any): string {
  if (!data) return '/notifications';

  // Jika ada orderId spesifik (notifikasi status pesanan) → buka detail pesanan langsung!
  if (data.orderId) {
    return `/orders/${data.orderId}`;
  }

  // Jika ada notificationId spesifik → buka detail notifikasi
  if (data.notificationId) {
    return `/notifications/${data.notificationId}`;
  }

  // Fallback ke halaman daftar notifikasi
  return '/notifications';
}

/**
 * Hook untuk:
 * 1. Minta izin notifikasi dari user
 * 2. Mendapatkan Expo Push Token dan menyimpannya ke backend
 * (Navigasi saat tap ditangani di _layout.tsx agar router sudah siap)
 */
export function usePushNotificationSetup() {
  const { token: authToken } = useAuthStore();
  const notificationListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Hanya jalankan jika user sudah login (punya token valid)
    if (!authToken || authToken === 'guest-token') return;

    registerForPushNotificationsAsync().then(pushToken => {
      if (pushToken) {
        savePushTokenToBackend(pushToken);
      }
    });

    // [FOREGROUND] Log saja — InAppNotificationManager yang menampilkan banner
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[PushNotif] Diterima (foreground):', notification.request.content.title);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
    };
  }, [authToken]);
}

/**
 * Minta izin dan dapatkan Expo Push Token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[PushNotif] Hanya bekerja di perangkat fisik.');
    return null;
  }

  // Setup Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Toko Kopi Jaya',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4B2C20',
      sound: 'default',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[PushNotif] Izin ditolak.');
    return null;
  }

  // Baca projectId dari EAS config (diisi otomatis setelah `npx eas init`)
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as any).easConfig?.projectId;

  if (!projectId) {
    console.warn(
      '[PushNotif] projectId tidak ditemukan. ' +
      'Jalankan: npx expo login  lalu  npx eas init  ' +
      'untuk mendaftarkan proyek ke EAS.'
    );
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[PushNotif] Token:', tokenData.data.substring(0, 30) + '...');
    return tokenData.data;
  } catch (error: any) {
    console.error('[PushNotif] Gagal get token:', error.message);
    return null;
  }
}

/**
 * Simpan Expo Push Token ke backend
 */
async function savePushTokenToBackend(pushToken: string): Promise<void> {
  try {
    await api.post('/notifications/register-token', { expoPushToken: pushToken });
    console.log('[PushNotif] Token tersimpan ke backend.');
  } catch (error: any) {
    console.warn('[PushNotif] Gagal simpan token:', error.response?.data?.message || error.message);
  }
}
