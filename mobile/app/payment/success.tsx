import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOrderDetail } from '../../services/queries';
import { Colors } from '../../constants/Colors';

export default function PaymentStatusScreen() {
  const router = useRouter();
  const { orderNumber, status, orderId } = useLocalSearchParams<{
    orderNumber: string;
    status: 'success' | 'pending' | 'error';
    orderId: string;
  }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const { data: order } = useOrderDetail(orderId);

  useEffect(() => {
    // Auto-redirect to order details if status changes to processing (paid)
    if (status === 'pending' && order && (order.status === 'processing' || order.status === 'confirmed')) {
      router.replace({
        pathname: '/order/[id]' as any,
        params: { id: orderId }
      });
    }
  }, [order, status]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const renderContent = () => {
    switch (status) {
      case 'success':
        return (
          <View style={styles.content}>
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }], backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
            </Animated.View>
            <Text style={styles.title}>Pembayaran Berhasil!</Text>
            <Text style={styles.subtitle}>Pesananmu sedang diproses oleh barista kami.</Text>
            <View style={styles.orderBox}>
              <Text style={styles.orderLabel}>Nomor Pesanan</Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
            </View>
          </View>
        );
      case 'pending':
        return (
          <View style={styles.content}>
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }], backgroundColor: '#FFF8E1' }]}>
              <Ionicons name="time" size={100} color="#F59E0B" />
            </Animated.View>
            <Text style={styles.title}>Menunggu Pembayaran</Text>
            <Text style={styles.subtitle}>Selesaikan pembayaran sesuai instruksi yang diberikan.</Text>
            <View style={styles.orderBox}>
              <Text style={styles.orderLabel}>Nomor Pesanan</Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
            </View>
            <Text style={styles.hintText}>Status akan diperbarui otomatis setelah pembayaran diverifikasi.</Text>
          </View>
        );
      case 'error':
      default:
        return (
          <View style={styles.content}>
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }], backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="close-circle" size={100} color="#F44336" />
            </Animated.View>
            <Text style={styles.title}>Pembayaran Gagal</Text>
            <Text style={styles.subtitle}>Maaf, terjadi kendala saat memproses pembayaranmu.</Text>
            <View style={styles.orderBox}>
              <Text style={styles.orderLabel}>Nomor Pesanan</Text>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.inner, { opacity: opacityAnim }]}>
        {renderContent()}

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={() => router.replace({
              pathname: '/order/[id]' as any,
              params: { id: orderId }
            })}
          >
            <Text style={styles.primaryBtnText}>Lihat Detail Pesanan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)/' as any)}
          >
            <Text style={styles.secondaryBtnText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  inner: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  orderBox: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  orderLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  hintText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  secondaryBtnText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '600',
  },
});
