import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';

// Cegah splash screen hilang otomatis sebelum aplikasi siap
SplashScreen.preventAutoHideAsync();
import * as Notifications from 'expo-notifications';
import { useAuthStore, useUserStore } from "../store/useStore";
import api from "../services/api";
import {
  usePushNotificationSetup,
  getRouteFromNotificationData,
} from '../hooks/usePushNotifications';
import { CustomStatusBar } from '../components/CustomStatusBar';

const queryClient = new QueryClient();

export default function RootLayout() {
  const { token, setToken } = useAuthStore();
  const { user, setUser, logout } = useUserStore();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const [isReady, setIsReady] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Registrasi push notification & simpan token ke backend
  usePushNotificationSetup();

  // Ref untuk mencegah navigasi cold-start dijalankan berkali-kali
  const coldStartHandled = useRef(false);

  useEffect(() => {
    if (!navigationState?.key) return;
    setIsReady(true);
  }, [navigationState?.key]);

  // AuthGate logic
  useEffect(() => {
    const checkAuth = async () => {
      if (token && token !== 'guest-token') {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.data);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // ─── PUSH NOTIFICATION NAVIGATION ─────────────────────────────────────────

  // [KASUS 1] App di-background → user tap notifikasi
  // Listener ini aktif selama app berjalan (foreground/background)
  useEffect(() => {
    if (!isReady) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      const route = getRouteFromNotificationData(data);
      console.log('[PushNotif] Tap saat background → navigate ke:', route);

      // Gunakan setTimeout kecil agar navigator benar-benar siap
      setTimeout(() => {
        router.push(route as any);
      }, 300);
    });

    return () => {
      subscription.remove();
    };
  }, [isReady]);

  // [KASUS 2] App sepenuhnya ditutup (cold start) → user tap notifikasi
  // Expo menyimpan response terakhir di getLastNotificationResponseAsync
  useEffect(() => {
    if (!isReady || coldStartHandled.current) return;

    const handleColdStart = async () => {
      try {
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) {
          const data = lastResponse.notification.request.content.data as any;
          const route = getRouteFromNotificationData(data);
          console.log('[PushNotif] Cold start dari notifikasi → navigate ke:', route);

          coldStartHandled.current = true;

          // Tunggu navigasi awal selesai sebelum push ke route notifikasi
          setTimeout(() => {
            router.push(route as any);
          }, 500);
        }
      } catch (error) {
        console.warn('[PushNotif] getLastNotificationResponseAsync error:', error);
      }
    };

    handleColdStart();
  }, [isReady]);

  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isReady || isCheckingAuth) return;

    // Sembunyikan splash screen setelah auth check selesai dan siap
    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === "login" || segments[0] === "auth";

    const timeout = setTimeout(() => {
      if (!token && !inAuthGroup) {
        router.replace("/login");
      } else if (token && !inAuthGroup && (!user || (user.isGuest && token !== 'guest-token'))) {
        router.replace("/login");
      } else if (token && token !== 'guest-token' && inAuthGroup) {
        router.replace("/(tabs)");
      }
    }, 1);

    return () => clearTimeout(timeout);
  }, [token, user, segments, isReady, isCheckingAuth]);

  if (!isReady || isCheckingAuth) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <CustomStatusBar />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="product/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="detail/[id]" />
          <Stack.Screen name="promo/[id]" />
          <Stack.Screen name="promo/all" />
          <Stack.Screen name="points/redeem" />
          <Stack.Screen name="cart" />
          <Stack.Screen name="address/select" />
          <Stack.Screen name="address/map" />
          <Stack.Screen name="checkout/index" options={{ headerShown: false }} />
          <Stack.Screen name="checkout/success" options={{ headerShown: false }} />
          <Stack.Screen name="orders/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="profile/payment" options={{ headerShown: false }} />
          <Stack.Screen name="profile/addresses" options={{ headerShown: false }} />
          <Stack.Screen name="profile/notifications" options={{ headerShown: false }} />
          <Stack.Screen name="profile/help" options={{ headerShown: false }} />
          <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
          <Stack.Screen name="notifications/[id]" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}