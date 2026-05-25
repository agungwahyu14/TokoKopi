import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomConfirmModal from '../../components/CustomConfirmModal';

export default function MidtransWebViewScreen() {
  const router = useRouter();
  const { token, orderNumber, orderId } = useLocalSearchParams<{ 
    token: string; 
    orderNumber: string;
    orderId: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // URL Midtrans Snap (Sandbox)
  const snapUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${token}`;

  const handleClose = () => {
    setConfirmVisible(true);
  };

  const handleNavigationChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    console.log('WebView URL Change:', url);

    // Deteksi status berdasarkan parameter URL yang dikirim Midtrans
    if (url.includes('status=success') || url.includes('transaction_status=settlement')) {
      router.replace({
        pathname: '/order/[id]' as any,
        params: { id: orderId },
      });
    } else if (url.includes('status=pending') || url.includes('transaction_status=pending')) {
      router.replace({
        pathname: '/payment/success' as any,
        params: { orderNumber, status: 'pending', orderId },
      });
    } else if (url.includes('status=failure') || url.includes('transaction_status=deny') || url.includes('transaction_status=cancel')) {
      router.replace({
        pathname: '/payment/success' as any,
        params: { orderNumber, status: 'error', orderId },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Custom */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#212121" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Pembayaran</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.webViewContainer}>
        <WebView
          source={{ uri: snapUrl }}
          onNavigationStateChange={handleNavigationChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#854F0B" />
            </View>
          )}
        />
      </View>

      {/* Loading overlay manual jika startInLoadingState tidak cukup */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#854F0B" />
          <Text style={styles.loadingText}>Menyiapkan halaman pembayaran...</Text>
        </View>
      )}

      <CustomConfirmModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onConfirm={() => {
          setConfirmVisible(false);
          router.replace({
            pathname: '/payment/success' as any,
            params: { orderNumber, status: 'pending', orderId },
          });
        }}
        title="Konfirmasi Keluar"
        message="Pembayaran belum selesai, yakin ingin keluar? Pesanan Anda akan tetap tersimpan."
        confirmText="Keluar"
        cancelText="Lanjutkan Bayar"
        iconName="exit-outline"
        isDestructive={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeBtn: {
    padding: 10,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  webViewContainer: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    color: '#757575',
  },
});
